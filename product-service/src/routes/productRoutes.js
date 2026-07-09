import express from 'express';
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import cognitoAuthMiddleware from "../middlewares/cognitoAuthMiddleware.js";
import authorizeRoles from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Public APIs
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin APIs
router.post(
  "/",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  addProduct
);

router.put(
  "/:id",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  updateProduct
);

router.delete(
  "/:id",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  deleteProduct
);

export default router;
