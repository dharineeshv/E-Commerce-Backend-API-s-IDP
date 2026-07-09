import * as paymentService from "../services/paymentService.js";
import "../config/env.js";
import axios from "axios";

const USER_PROFILE_SERVICE_URL = process.env.USER_PROFILE_SERVICE_URL;

const getCustomerIdFromSub = async (cognitoSub) => {
  const response = await axios.get(
    `${USER_PROFILE_SERVICE_URL}/api/profile/me/${cognitoSub}`
  );

  return response.data.data.customerId;
};

const processPayment = async (req, res) => {
  try {

    const cognitoSub = req.user.sub;

    const customerId = await getCustomerIdFromSub(cognitoSub);

    const payment = await paymentService.processPayment({
      ...req.body,
      customerId,
    });

    return res.status(201).json({
      message: "Payment Processed Successfully",
      payment,
    });

  } catch (error) {
    console.error("Error processing payment:", error);

    const status =
      error.statusCode ||
      error.response?.status ||
      (error.message.includes("required") ||
      error.message.includes("Invalid")
        ? 400
        : error.message.includes("not found")
        ? 404
        : error.message.includes("cancelled")
        ? 400
        : 500);

    return res.status(status).json({
      success: false,
      message: error.response?.data?.message || error.message,
    });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await paymentService.getAllPayments();
    return res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const cognitoSub = req.user.sub;
const customerId = await getCustomerIdFromSub(cognitoSub);

const payment = await paymentService.getPaymentById(
  req.params.paymentId,
  customerId
);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    return res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentByOrderId = async (req, res) => {
  try {
    const cognitoSub = req.user.sub;

const customerId = await getCustomerIdFromSub(cognitoSub);

const payment = await paymentService.getPaymentByOrderId(
  req.params.orderId,
  customerId
);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    return res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error('Error fetching payment by order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    if (!req.body.status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }
    const payment = await paymentService.updatePaymentStatus(req.params.paymentId, req.body.status);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    return res.status(200).json({ success: true, message: 'Payment Status Updated Successfully', payment });
  } catch (error) {
    console.error('Error updating payment status:', error);
    const status = error.message.includes('Invalid status') ? 400 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

const refundPayment = async (req, res) => {
  try {
    const cognitoSub = req.user.sub;
const customerId = await getCustomerIdFromSub(cognitoSub);

const payment = await paymentService.refundPayment(
  req.params.paymentId,
  customerId
);
    return res.status(200).json({ success: true, message: 'Payment Refunded Successfully', payment });
  } catch (error) {
    console.error('Error refunding payment:', error);
    const status = error.message.includes('not found') ? 404
      : error.message.includes('Cannot refund') ? 400
      : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

export {
  processPayment,
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  updatePaymentStatus,
  refundPayment,
};
