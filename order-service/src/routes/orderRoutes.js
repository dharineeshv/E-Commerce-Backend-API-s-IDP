import express from "express";
import * as orderController from "../controllers/orderController.js";
import cognitoAuthMiddleware from "../middlewares/cognitoAuthMiddleware.js";
import authorizeRoles from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    message: "Order Service Working",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

//admin routes ]
router.get(
  "/admin/all",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  orderController.getAllOrders
);

router.patch(
  "/admin/:orderId/status",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  orderController.updateOrderStatus
);

// ── Customer Routes ──────────────────────────────────────────

router.post(
  "/",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  orderController.placeOrder
);

router.get(
  "/",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  orderController.getMyOrders
);

router.get(
  "/:orderId",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  orderController.getOrderById
);

router.patch(
  "/:orderId/cancel",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  orderController.cancelOrder
);


export default router;
