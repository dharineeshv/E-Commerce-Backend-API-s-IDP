import "../config/env.js";
import { v4 as uuidv4 } from "uuid";
import {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import dynamodb from "../config/dynamodb.js";
import { publishEvent } from "./snsService.js";

const PAYMENT_TABLE = process.env.DYNAMODB_TABLE || 'Payments';
const ORDER_TABLE = process.env.ORDER_TABLE || 'Dharineesh_orders';

const allowedPaymentMethods = ['UPI', 'COD', 'Razorpay'];
const allowedStatuses = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'];

const buildPaymentPayload = ({ paymentId, orderId, customerId, amount, paymentMethod, status, paymentDate }) => ({
  paymentId, orderId, customerId, amount, paymentMethod, status, paymentDate,
});

const verifyOrder = async (orderId, customerId) => {
  const response = await dynamodb.send(
    new GetCommand({
      TableName: ORDER_TABLE,
      Key: { orderId },
    })
  );

  const order = response.Item;

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.customerId !== customerId) {
    const error = new Error('Unauthorized: This order does not belong to you');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

const processPayment = async (paymentData) => {
  const { orderId, customerId, amount, paymentMethod } = paymentData;

  if (!orderId || !amount || !paymentMethod) {
    throw new Error("orderId, amount, and paymentMethod are required");
  }

  if (!customerId) {
    throw new Error("Customer not authenticated");
  }

  if (!allowedPaymentMethods.includes(paymentMethod)) {
    throw new Error(`Invalid payment method. Allowed methods: ${allowedPaymentMethods.join(', ')}`);
  }

  const order = await verifyOrder(orderId, customerId);
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'CANCELLED') {
    throw new Error('Cannot process payment for cancelled order');
  }

  const paymentId = uuidv4();
  const status = (paymentMethod === 'UPI' || paymentMethod === 'Razorpay') ? 'SUCCESS' : 'PENDING';
  const payment = {
    paymentId,
    orderId,
    customerId,
    amount: Number(amount),
    paymentMethod,
    status,
    paymentDate: new Date().toISOString(),
  };

  await dynamodb.send(
    new PutCommand({
      TableName: PAYMENT_TABLE,
      Item: payment,
    })
  );

  const eventType = (paymentMethod === 'UPI' || paymentMethod === 'Razorpay') ? 'PAYMENT_SUCCESS' : 'PAYMENT_PENDING';
  try {
    await publishEvent(eventType, buildPaymentPayload(payment));
  } catch (error) {
    console.error(`[paymentService] Failed to publish ${eventType}`, {
      paymentId: payment.paymentId,
      message: error.message,
    });
  }

  return payment;
};

const getAllPayments = async () => {
  const response = await dynamodb.send(new ScanCommand({ TableName: PAYMENT_TABLE }));
  return response.Items || [];
};

const getPaymentById = async (paymentId, customerId = null) => {
  const response = await dynamodb.send(
    new GetCommand({
      TableName: PAYMENT_TABLE,
      Key: { paymentId },
    })
  );

  const payment = response.Item;

  if (!payment) {
    return null;
  }

  if (customerId && payment.customerId !== customerId) {
    throw new Error("Unauthorized: This payment does not belong to you");
  }

  return payment;
};

const getPaymentByOrderId = async (orderId, customerId) => {
  const response = await dynamodb.send(
    new ScanCommand({
      TableName: PAYMENT_TABLE,
      FilterExpression: "orderId = :orderId",
      ExpressionAttributeValues: {
        ":orderId": orderId,
      },
    })
  );

  const payment = response.Items?.[0] || null;

  if (!payment) {
    return null;
  }

  if (payment.customerId !== customerId) {
    throw new Error("Unauthorized: This payment does not belong to you");
  }

  return payment;
};


const updatePaymentStatus = async (paymentId, status) => {
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Invalid status. Allowed values: ${allowedStatuses.join(', ')}`);
  }

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: PAYMENT_TABLE,
      Key: { paymentId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes;
};

const refundPayment = async (paymentId, customerId) => {
  const existing = await getPaymentById(paymentId, customerId);
  if (!existing) {
    throw new Error('Payment not found');
  }

  if (existing.status !== 'SUCCESS') {
    throw new Error(`Cannot refund payment. Current status: ${existing.status}`);
  }

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: PAYMENT_TABLE,
      Key: { paymentId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'REFUNDED',
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  try {
    await publishEvent('PAYMENT_REFUNDED', buildPaymentPayload(result.Attributes));
  } catch (error) {
    console.error('[paymentService] Failed to publish PAYMENT_REFUNDED', {
      paymentId,
      message: error.message,
    });
  }

  return result.Attributes;
};

export {
  processPayment,
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  updatePaymentStatus,
  refundPayment,
};
