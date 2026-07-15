import {
  createProduct,
  fetchProducts,
  fetchProductById,
  modifyProduct,
  removeProduct,
  uploadImageToS3,
} from "../services/productService.js";

// ==========================================================
// Upload Product Image
// ==========================================================

export async function uploadProductImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image.",
      });
    }

    const result = await uploadImageToS3(req.file);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully.",
      imageUrl: result.imageUrl,
      imageKey: result.imageKey,
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================================
// Create Product
// ==========================================================

export async function addProduct(req, res, next) {
  try {
    const product = await createProduct(req.body);

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================================
// Get All Products
// ==========================================================

export async function getProducts(req, res, next) {
  try {
    const products = await fetchProducts();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================================
// Get Product By Id
// ==========================================================

export async function getProductById(req, res, next) {
  try {
    const product = await fetchProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================================
// Update Product
// ==========================================================

export async function updateProduct(req, res, next) {
  try {
    const product = await modifyProduct(req.params.id, req.body);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================================
// Delete Product
// ==========================================================

export async function deleteProduct(req, res, next) {
  try {
    const deleted = await removeProduct(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}