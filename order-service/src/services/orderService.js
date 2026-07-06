import "../config/env.js";
import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import dynamodb from "../config/dynamodb.js";
import { v4 as uuidv4 } from "uuid";
import { publishEvent } from "./snsService.js";

const ORDER_TABLE = process.env.ORDER_TABLE || "Orders";
const CART_TABLE = process.env.CART_TABLE || "Cart";

const getCustomerEmail = (shippingAddress) => {
  return (
    shippingAddress?.customerEmail ||
    shippingAddress?.email ||
    shippingAddress?.contactEmail ||
    shippingAddress?.contact?.email ||
    null
  );
};

const getCustomerMobile = (shippingAddress) => {
  return (
    shippingAddress?.customerMobile ||
    shippingAddress?.mobile ||
    shippingAddress?.phone ||
    shippingAddress?.contactMobile ||
    shippingAddress?.contact?.mobile ||
    shippingAddress?.contact?.phone ||
    null
  );
};

const buildOrderPlacedPayload = (order, shippingAddress) => {
  return {
    eventType: "ORDER_PLACED",
    orderId: order.orderId,
    customerId: order.customerId,
    customerEmail: getCustomerEmail(shippingAddress),
    customerMobile: getCustomerMobile(shippingAddress),
    products: order.items,
    totalAmount: order.orderTotal,
    orderStatus: order.status,
    createdAt: order.createdAt,
  };
};

const buildOrderCancelledPayload = (order, cancelledAt) => {
  return {
    eventType: "ORDER_CANCELLED",
    orderId: order.orderId,
    products: order.items || [],
    cancelledAt,
  };
};

// Fetch all cart items for a customer — Cart table has only customerId as HASH key (no sort key)
// Each customer row stores a single cart item, so we scan and filter by customerId
const getCartItems = async (customerId) => {
  const params = {
    TableName: CART_TABLE,
    FilterExpression: "customerId = :customerId",
    ExpressionAttributeValues: {
      ":customerId": customerId,
    },
  };
  const response = await dynamodb.send(new ScanCommand(params));
  return response.Items || [];
};

// Clear cart — delete the customer's cart row using only customerId (the only key)
const clearCartItems = async (customerId) => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: CART_TABLE,
      Key: { customerId },
    })
  );
};

// Place a new order from cart items
const placeOrder = async (customerId, shippingAddress) => {
  const cartItems = await getCartItems(customerId);

  if (!cartItems || cartItems.length === 0) {
    throw new Error("Cart is empty. Add products to cart before placing an order.");
  }

  const orderId = uuidv4();
  const orderTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const orderItems = cartItems.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    price: item.price,
    quantity: item.quantity,
    totalPrice: item.totalPrice,
  }));

  const order = {
    orderId,
    customerId,
    items: orderItems,
    orderTotal,
    status: "PENDING",
    shippingAddress: shippingAddress || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dynamodb.send(
    new PutCommand({
      TableName: ORDER_TABLE,
      Item: order,
    })
  );

  try {
    const publishResponse = await publishEvent(
      "ORDER_PLACED",
      buildOrderPlacedPayload(order, shippingAddress)
    );

    console.log("ORDER_PLACED event published successfully", {
      orderId: order.orderId,
      messageId: publishResponse?.MessageId,
    });
  } catch (error) {
    console.error("Failed to publish ORDER_PLACED event", {
      orderId: order.orderId,
      message: error.message,
      stack: error.stack,
    });
  }

  // Clear cart after successful order placement
  await clearCartItems(customerId);

  return {
    success: true,
    message: "Order placed successfully",
    data: order,
  };
};

// Get a single order by orderId and customerId
const getOrderById = async (customerId, orderId) => {
  const params = {
    TableName: ORDER_TABLE,
    Key: { orderId },
  };

  const response = await dynamodb.send(new GetCommand(params));
  const order = response.Item;

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.customerId !== customerId) {
    throw new Error("Unauthorized: This order does not belong to you");
  }

  return {
    success: true,
    message: "Order retrieved successfully",
    data: order,
  };
};

// Get all orders for a customer using GSI
const getOrdersByCustomer = async (customerId) => {
  const params = {
    TableName: ORDER_TABLE,
    IndexName: "customerId-index",
    KeyConditionExpression: "customerId = :customerId",
    ExpressionAttributeValues: {
      ":customerId": customerId,
    },
  };

  const response = await dynamodb.send(new QueryCommand(params));

  return {
    success: true,
    message: "Orders retrieved successfully",
    data: response.Items || [],
    count: response.Count || 0,
  };
};

// Get all orders (admin)
const getAllOrders = async () => {
  const params = {
    TableName: ORDER_TABLE,
  };

  const response = await dynamodb.send(new ScanCommand(params));

  return {
    success: true,
    message: "All orders retrieved successfully",
    data: response.Items || [],
    count: response.Count || 0,
  };
};

// Cancel an order (customer can cancel only PENDING orders)
const cancelOrder = async (customerId, orderId) => {
  const getParams = {
    TableName: ORDER_TABLE,
    Key: { orderId },
  };

  const response = await dynamodb.send(new GetCommand(getParams));
  const order = response.Item;

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.customerId !== customerId) {
    throw new Error("Unauthorized: This order does not belong to you");
  }

  if (order.status !== "PENDING") {
    throw new Error(`Cannot cancel order. Current status: ${order.status}`);
  }

  const updateParams = {
    TableName: ORDER_TABLE,
    Key: { orderId },
    UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#status": "status",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":status": "CANCELLED",
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW",
  };

  const updated = await dynamodb.send(new UpdateCommand(updateParams));

  const cancelledAt = updated.Attributes?.updatedAt || new Date().toISOString();

  try {
    const publishResponse = await publishEvent(
      "ORDER_CANCELLED",
      buildOrderCancelledPayload(updated.Attributes || order, cancelledAt)
    );

    console.log("ORDER_CANCELLED event published successfully", {
      orderId,
      messageId: publishResponse?.MessageId,
    });
  } catch (error) {
    console.error("Failed to publish ORDER_CANCELLED event", {
      orderId,
      message: error.message,
      stack: error.stack,
    });
  }

  return {
    success: true,
    message: "Order cancelled successfully",
    data: updated.Attributes,
  };
};

// Update order status (admin only — PENDING, SHIPPED, DELIVERED, CANCELLED)
const updateOrderStatus = async (orderId, status) => {
  const allowedStatuses = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];

  if (!allowedStatuses.includes(status)) {
    throw new Error(
      `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
    );
  }

  const getParams = {
    TableName: ORDER_TABLE,
    Key: { orderId },
  };

  const response = await dynamodb.send(new GetCommand(getParams));

  if (!response.Item) {
    throw new Error("Order not found");
  }

  const updateParams = {
    TableName: ORDER_TABLE,
    Key: { orderId },
    UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#status": "status",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":status": status,
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW",
  };

  const updated = await dynamodb.send(new UpdateCommand(updateParams));

  return {
    success: true,
    message: `Order status updated to ${status}`,
    data: updated.Attributes,
  };
};

export {
  placeOrder,
  getOrderById,
  getOrdersByCustomer,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
};
