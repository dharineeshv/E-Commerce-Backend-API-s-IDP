import express from "express";
import * as orderController from "../controllers/orderController.js";

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    message: "Order Service Working",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ── Customer Routes ──────────────────────────────────────────

// Place order from cart
router.post("/:customerId", orderController.placeOrder);

// Get all orders for a customer
router.get("/:customerId", orderController.getMyOrders);

// Get a specific order for a customer
router.get("/:customerId/:orderId", orderController.getOrderById);

// Cancel an order (only PENDING orders)
router.patch("/:customerId/:orderId/cancel", orderController.cancelOrder);

// ── Admin Routes ─────────────────────────────────────────────

// Get all orders (admin)
router.get("/admin/all", orderController.getAllOrders);

// Update order status (admin: PENDING, SHIPPED, DELIVERED, CANCELLED)
router.patch("/admin/:orderId/status", orderController.updateOrderStatus);

export default router;
