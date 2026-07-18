import express from "express";
import {
  processPayment,
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  updatePaymentStatus,
  refundPayment,
} from "../controllers/paymentController.js";
import cognitoAuthMiddleware from "../middlewares/cognitoAuthMiddleware.js";
import authorizeRoles from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Customer Routes

router.post(
  "/",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  processPayment
);

router.get(
  "/order/:orderId",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  getPaymentByOrderId
);

router.get(
  "/:paymentId",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  getPaymentById
);

router.put(
  "/:paymentId/refund",
  cognitoAuthMiddleware,
  authorizeRoles("Customer", "Admin"),
  refundPayment
);

// Admin Routes

router.get(
  "/",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  getAllPayments
);

router.put(
  "/:paymentId/status",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  updatePaymentStatus
);

export default router;
