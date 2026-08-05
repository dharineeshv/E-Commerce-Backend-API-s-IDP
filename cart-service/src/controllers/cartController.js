import "../config/env.js";
import axios from "axios";
import * as cartService from "../services/cartService.js";

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:5000";
const PRODUCT_SERVICE_BASE_URL = PRODUCT_SERVICE_URL.replace(/\/api\/products\/?$/i, "");
const USER_PROFILE_SERVICE_URL =
  process.env.USER_PROFILE_SERVICE_URL;

  console.log("PRODUCT_SERVICE_URL =", PRODUCT_SERVICE_URL);
console.log("USER_PROFILE_SERVICE_URL =", USER_PROFILE_SERVICE_URL);

const getProductServiceItemUrl = (productId) => {
  const safeProductId = encodeURIComponent(String(productId || "").trim());
  return `${PRODUCT_SERVICE_BASE_URL}/api/v1/products/${safeProductId}`;
};

const getCustomerIdFromSub = async (cognitoSub) => {
  console.log("Inside getCustomerIdFromSub");
  console.log("Cognito Sub:", cognitoSub);

  const safeSub = encodeURIComponent(String(cognitoSub || "").trim());
  const response = await axios.get(
    `${USER_PROFILE_SERVICE_URL}/api/v1/profile/me/${safeSub}`
  );

  console.log("Profile Response:", response.data);

  return response.data.data.customerId;
};

const sendErrorResponse = (res, error, fallbackMessage) => {

  console.log("======================================");
  console.log("Axios URL:", error.config?.url);
  console.log("Axios Method:", error.config?.method);
  console.log("======================================");

  console.error(fallbackMessage, {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    data: error.response?.data,
    stack: error.stack,
  });

  return res.status(error.response?.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
    code: error.code,
    details: error.response?.data,
  });
};
// Add product to cart
const addToCart = async (req, res) => {
  try {
    
    const { productId, quantity } = req.body;

const cognitoSub = req.user.sub;

const customerId = await getCustomerIdFromSub(cognitoSub);

    // Validation
    if (!productId || quantity === undefined)  {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: customerId, productId, quantity",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const url = getProductServiceItemUrl(productId);

console.log("Calling Product URL:", url);

const productResponse = await axios.get(url);

console.log("Product Response:");
console.log(JSON.stringify(productResponse.data, null, 2));

const product = productResponse.data?.product;

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found in product service",
      });
    }

    if (product.quantity !== undefined && product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available product stock",
      });
    }

    const productImageUrl = product.imageUrl || (product.images && product.images.length > 0 ? (product.images[0].imageUrl || product.images[0]) : null);

    const result = await cartService.addProductToCart(customerId, {
      productId,
      productName: product.name,
      price: product.sellingPrice || product.price,
      quantity,
      imageUrl: productImageUrl
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error adding to cart:", error);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Product not found in product service",
      });
    }
    return sendErrorResponse(res, error, "Failed to add product to cart");
  }
};

// Get cart products
const getCart = async (req, res) => {
  try {

    const cognitoSub = req.user.sub;

    const customerId = await getCustomerIdFromSub(cognitoSub);

    const result = await cartService.getCartProducts(customerId);

    return res.status(200).json(result);

  } catch (error) {
    return sendErrorResponse(res, error, "Failed to retrieve cart");
  }
};

// Delete product from cart
const deleteFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;

const cognitoSub = req.user.sub;

const customerId = await getCustomerIdFromSub(cognitoSub);

    if (!cartItemId)  {
      return res.status(400).json({
        success: false,
        message: "customerId and cartItemId are required",
      });
    }

    const result = await cartService.deleteProductFromCart(customerId, cartItemId);
    return res.status(200).json(result);
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to delete product from cart");
  }
};

// Update product quantity
const updateQuantity = async (req, res) => {
  try {
    const { cartItemId } = req.params;

const cognitoSub = req.user.sub;

const customerId = await getCustomerIdFromSub(cognitoSub);
    const { quantity } = req.body;

    if (!cartItemId)  {
      return res.status(400).json({
        success: false,
        message: "customerId and cartItemId are required",
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const cartItem = await cartService.getCartItem(customerId, cartItemId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const productResponse = await axios.get(getProductServiceItemUrl(cartItem.productId));
    const product = productResponse.data?.product;

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found in product service",
      });
    }

    if (product.quantity !== undefined && product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available product stock",
      });
    }

    const result = await cartService.updateProductQuantity(
      customerId,
      cartItemId,
      quantity
    );
    return res.status(200).json(result);
  } catch (error) {
    return sendErrorResponse(res, error, "Failed to update product quantity");
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {

    const cognitoSub = req.user.sub;

    const customerId = await getCustomerIdFromSub(cognitoSub);

    const result = await cartService.clearCart(customerId);

    return res.status(200).json(result);

  } catch (error) {
    return sendErrorResponse(res, error, "Failed to clear cart");
  }
};

export {
  addToCart,
  getCart,
  deleteFromCart,
  updateQuantity,
  clearCart,
};
