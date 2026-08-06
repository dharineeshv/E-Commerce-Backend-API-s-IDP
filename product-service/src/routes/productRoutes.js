import express from "express";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "../controllers/productController.js";

import cognitoAuthMiddleware from "../middlewares/cognitoAuthMiddleware.js";
import authorizeRoles from "../middlewares/authorizeRoles.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// ==========================================================
// Public APIs
// ==========================================================

router.get("/", getProducts);

router.get("/:id", getProductById);

// ==========================================================
// Admin APIs
// ==========================================================

// Upload Product Image
router.post(
  "/upload-image",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  upload.single("image"),
  uploadProductImage
);

// Create Product
router.post(
  "/",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  addProduct
);

// Update Product
router.put(
  "/:id",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  updateProduct
);

// Delete Product
router.delete(
  "/:id",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  deleteProduct
);

export default router;