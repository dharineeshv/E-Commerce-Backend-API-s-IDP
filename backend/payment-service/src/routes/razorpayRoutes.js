import express from "express";
import { createOrder, verifyPayment } from "../controllers/razorpayController.js";
import cognitoAuthMiddleware from "../middlewares/cognitoAuthMiddleware.js";

const router = express.Router();

router.post("/create-order", cognitoAuthMiddleware, createOrder);
router.post("/verify-payment", cognitoAuthMiddleware, verifyPayment);

export default router;
