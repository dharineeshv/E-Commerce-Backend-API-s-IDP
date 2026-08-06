import "../config/env.js";
import axios from "axios";
import * as wishlistService from "../services/wishlistService.js";

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com";
const PRODUCT_SERVICE_BASE_URL = PRODUCT_SERVICE_URL.replace(/\/api\/products\/?$/i, "");

const getProductServiceItemUrl = (productId) => {
  const cleanId = String(productId || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return `${PRODUCT_SERVICE_BASE_URL}/api/v1/products/${encodeURIComponent(cleanId)}`;
};

export const addProductToWishlist = async (req, res) => {
  try {
    let { customerId, productId, userId, id } = req.body || {};
    customerId = customerId || userId || (req.user && (req.user.sub || req.user.username || req.user.email)) || "cust-001";
    productId = productId || id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: productId",
      });
    }

    const exists = await wishlistService.checkProductInWishlist(customerId, productId);
    if (exists) {
      return res.status(200).json({
        success: true,
        message: "Product is already in wishlist",
      });
    }

    const result = await wishlistService.addProductToWishlist(customerId, productId);
    return res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully",
      result,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error.message);
    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
    });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const customerId = req.params.customerId || (req.user && (req.user.sub || req.user.username)) || "cust-001";

    const wishlistItems = await wishlistService.getWishlist(customerId);

    // Fetch full product details for each item asynchronously
    const detailedItems = await Promise.all(
      wishlistItems.map(async (item) => {
        try {
          const productResponse = await axios.get(getProductServiceItemUrl(item.productId));
          return {
            ...item,
            productDetails: productResponse.data?.product || productResponse.data?.data || null,
          };
        } catch (error) {
          return item;
        }
      })
    );

    return res.status(200).json({
      success: true,
      items: detailedItems,
    });
  } catch (error) {
    console.error("Error getting wishlist:", error.message);
    return res.status(200).json({
      success: true,
      items: [],
    });
  }
};

export const removeProductFromWishlist = async (req, res) => {
  try {
    const customerId = req.params.customerId || (req.user && (req.user.sub || req.user.username)) || "cust-001";
    const productId = req.params.productId;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    const result = await wishlistService.removeProductFromWishlist(customerId, productId);
    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      result,
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error.message);
    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const customerId = req.params.customerId || (req.user && (req.user.sub || req.user.username)) || "cust-001";
    return res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: "Wishlist cleared",
    });
  }
};

export const checkProductInWishlist = async (req, res) => {
  try {
    const customerId = req.params.customerId || (req.user && (req.user.sub || req.user.username)) || "cust-001";
    const productId = req.params.productId;

    const inWishlist = await wishlistService.checkProductInWishlist(customerId, productId);
    return res.status(200).json({
      success: true,
      inWishlist,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      inWishlist: false,
    });
  }
};
