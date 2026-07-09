import express from "express";
import * as cartController from "../controllers/cartController.js";
import cognitoAuthMiddleware from "../middlewares/cognitoAuthMiddleware.js";
import authorizeRoles from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Health check
router.get(
  "/health",
  cognitoAuthMiddleware,
  (req, res) => {
    res.json({
      success: true,
      message: "Cart Service Working",
      user: req.user,
    });
  }
);

// Add product to cart
router.post(
  "/",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  cartController.addToCart
);

router.get(
  "/",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  cartController.getCart
);

router.put(
  "/:cartItemId",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  cartController.updateQuantity
);

router.delete(
  "/clear",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  cartController.clearCart
);

router.delete(
  "/:cartItemId",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  cartController.deleteFromCart
);
export default router;