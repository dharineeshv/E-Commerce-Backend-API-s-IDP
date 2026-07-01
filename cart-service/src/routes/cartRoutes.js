import express from "express";
import * as cartController from "../controllers/cartController.js";

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    message: "Cart Service Working",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Add product to cart
router.post("/:customerId", cartController.addToCart);

// Get cart for customer
router.get("/:customerId", cartController.getCart);

// Update product quantity in cart
router.put("/:customerId/:cartItemId", cartController.updateQuantity);

// Delete product from cart
router.delete("/:customerId/:cartItemId", cartController.deleteFromCart);

// Clear entire cart
router.delete("/:customerId/cart/clear", cartController.clearCart);

export default router;