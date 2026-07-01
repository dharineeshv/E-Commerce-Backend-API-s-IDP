import express from "express";
import {
  processPayment,
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  updatePaymentStatus,
  refundPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post('/', processPayment);
router.get('/', getAllPayments);
router.get('/order/:orderId', getPaymentByOrderId);
router.get('/:paymentId', getPaymentById);
router.put('/:paymentId/status', updatePaymentStatus);
router.put('/:paymentId/refund', refundPayment);

export default router;
