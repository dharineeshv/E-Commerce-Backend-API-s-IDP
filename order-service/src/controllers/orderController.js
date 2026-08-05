import "../config/env.js";
import axios from "axios";
import * as orderService from "../services/orderService.js";

const USER_PROFILE_SERVICE_URL = process.env.USER_PROFILE_SERVICE_URL;

const getCustomerIdFromSub = async (cognitoSub) => {
  const safeSub = encodeURIComponent(String(cognitoSub || "").trim());
  const response = await axios.get(
    `${USER_PROFILE_SERVICE_URL}/api/v1/profile/me/${safeSub}`
  );

  return response.data.data.customerId;
};


// Place order from cart
const placeOrder = async (req, res) => {
  try {
    const cognitoSub = req.user.sub;

     const customerId = await getCustomerIdFromSub(cognitoSub);

    const { shippingAddress, calculatedTotal } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const result = await orderService.placeOrder(customerId, shippingAddress, calculatedTotal);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error placing order:", error);
    const status = error.message.includes("empty") ? 400 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to place order",
    });
  }
};

// Get single order by orderId (customer)
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

const cognitoSub = req.user.sub;

const customerId = await getCustomerIdFromSub(cognitoSub);
     if (!orderId){
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const result = await orderService.getOrderById(customerId, orderId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching order:", error);
    const status = error.message.includes("not found")
      ? 404
      : error.message.includes("Unauthorized")
      ? 403
      : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
};

// Get all orders for a customer
const getMyOrders = async (req, res) => {
  try {
    const cognitoSub = req.user.sub;

const customerId = await getCustomerIdFromSub(cognitoSub);

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const result = await orderService.getOrdersByCustomer(customerId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

// Get all orders — admin
const getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrders();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch all orders",
    });
  }
};

// Cancel order (customer)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

const cognitoSub = req.user.sub;

const customerId = await getCustomerIdFromSub(cognitoSub);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const result = await orderService.cancelOrder(customerId, orderId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error cancelling order:", error);
    const status = error.message.includes("not found")
      ? 404
      : error.message.includes("Unauthorized")
      ? 403
      : error.message.includes("Cannot cancel")
      ? 400
      : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to cancel order",
    });
  }
};

// Update order status — admin
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    const result = await orderService.updateOrderStatus(orderId, status);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating order status:", error);
    const status = error.message.includes("not found")
      ? 404
      : error.message.includes("Invalid status")
      ? 400
      : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

export {
  placeOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
};
