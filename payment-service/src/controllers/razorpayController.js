import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";
import "../config/env.js";
import * as paymentService from "../services/paymentService.js";

const USER_PROFILE_SERVICE_URL = process.env.USER_PROFILE_SERVICE_URL;

const getCustomerIdFromSub = async (cognitoSub) => {
  const response = await axios.get(
    `${USER_PROFILE_SERVICE_URL}/api/v1/profile/me/${cognitoSub}`
  );
  return response.data.data.customerId;
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt = "receipt#1" } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: "Invalid amount. Minimum amount is 100 paise." });
    }

    const options = {
      amount,
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res.status(500).json({ success: false, message: "Error creating Razorpay order", error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay payment details" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed: Signature mismatch" });
    }

    const cognitoSub = req.user.sub;
    const customerId = await getCustomerIdFromSub(cognitoSub);

    // Since signature matches, record the payment as success
    if (orderId && customerId && amount) {
        await paymentService.processPayment({
          orderId,
          customerId,
          paymentMethod: "Razorpay",
          amount,
          transactionId: razorpay_payment_id
        });
    }

    return res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ success: false, message: "Error verifying payment", error: error.message });
  }
};
