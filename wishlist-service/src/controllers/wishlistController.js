import "../config/env.js";
import axios from "axios";
import * as wishlistService from "../services/wishlistService.js";

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:5000";
const PRODUCT_SERVICE_BASE_URL = PRODUCT_SERVICE_URL.replace(/\/api\/products\/?$/i, "");

const getProductServiceItemUrl = (productId) => {
  const safeProductId = encodeURIComponent(String(productId || "").trim());
  return `${PRODUCT_SERVICE_BASE_URL}/api/v1/products/${safeProductId}`;
};

const sendErrorResponse = (res, error, fallbackMessage) => {
  return res.status(error.response?.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

export const addProductToWishlist = async (req, res) => {
  try {
    const { customerId, productId } = req.body;

    if (!customerId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: customerId, productId",
      });
    }

    // Verify product exists
    let product;
    try {
      const productResponse = await axios.get(getProductServiceItemUrl(productId));
      product = productResponse.data.product;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({
          success: false,
          message: "Product not found in product service",
        });
      }
      throw error;
    }

    // Check if already in wishlist
    const exists = await wishlistService.checkProductInWishlist(customerId, productId);
    if (exists) {
      return res.status(200).json({
        success: true,
        message: "Product is already in wishlist",
      });
    }

    const result = await wishlistService.addProductToWishlist(customerId, productId);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return sendErrorResponse(res, error, "Failed to add product to wishlist");
  }
};

export const getWishlist = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const wishlistItems = await wishlistService.getWishlist(customerId);

    // Fetch full product details for each item
    const detailedItems = await Promise.all(
      wishlistItems.map(async (item) => {
        try {
          const productResponse = await axios.get(getProductServiceItemUrl(item.productId));
          return {
            ...item,
            productDetails: productResponse.data.product,
          };
        } catch (error) {
          console.error(`Failed to fetch product details for ${item.productId}`, error.message);
          return item; // return without details if it fails
        }
      })
    );

    return res.status(200).json({
      success: true,
      items: detailedItems,
    });
  } catch (error) {
    console.error("Error getting wishlist:", error);
    return sendErrorResponse(res, error, "Failed to get wishlist");
  }
};

export const removeProductFromWishlist = async (req, res) => {
  try {
    const { customerId, productId } = req.params;

    if (!customerId || !productId) {
      return res.status(400).json({
        success: false,
        message: "customerId and productId are required",
      });
    }

    const result = await wishlistService.removeProductFromWishlist(customerId, productId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return sendErrorResponse(res, error, "Failed to remove product from wishlist");
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const result = await wishlistService.clearWishlist(customerId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    return sendErrorResponse(res, error, "Failed to clear wishlist");
  }
};

export const checkProductInWishlist = async (req, res) => {
  try {
    const { customerId, productId } = req.params;

    if (!customerId || !productId) {
      return res.status(400).json({
        success: false,
        message: "customerId and productId are required",
      });
    }

    const exists = await wishlistService.checkProductInWishlist(customerId, productId);
    return res.status(200).json({
      success: true,
      exists,
    });
  } catch (error) {
    console.error("Error checking product in wishlist:", error);
    return sendErrorResponse(res, error, "Failed to check product in wishlist");
  }
};
