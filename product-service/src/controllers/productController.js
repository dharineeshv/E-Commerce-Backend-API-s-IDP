import {
  createProduct,
  fetchProducts,
  fetchProductById,
  modifyProduct,
  removeProduct,
} from '../services/productService.js';

export async function addProduct(req, res, next) {
  try {
    const product = await createProduct(req.body);
    res.status(201).json({ success: true, message: 'Product added successfully', product });
  } catch (error) {
    next(error);
  }
}

export async function getProducts(req, res, next) {
  try {
    const products = await fetchProducts();
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const product = await fetchProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await modifyProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const deleted = await removeProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
}
