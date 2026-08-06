import { API } from "../config.js";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("User is not authenticated");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function addProductToWishlist(customerId, productId) {
  try {
    const response = await fetch(`${API.wishlistService}/api/v1/wishlist`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ customerId, productId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add product to wishlist. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in addProductToWishlist API:", error);
    throw error;
  }
}

export async function getWishlist(customerId) {
  try {
    const response = await fetch(`${API.wishlistService}/api/v1/wishlist/${customerId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wishlist. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getWishlist API:", error);
    throw error;
  }
}

export async function removeProductFromWishlist(customerId, productId) {
  try {
    const response = await fetch(`${API.wishlistService}/api/v1/wishlist/${customerId}/${productId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove product from wishlist. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in removeProductFromWishlist API:", error);
    throw error;
  }
}

export async function clearWishlist(customerId) {
  try {
    const response = await fetch(`${API.wishlistService}/api/v1/wishlist/${customerId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to clear wishlist. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in clearWishlist API:", error);
    throw error;
  }
}

export async function checkProductInWishlist(customerId, productId) {
  try {
    const response = await fetch(`${API.wishlistService}/api/v1/wishlist/${customerId}/check/${productId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to check product in wishlist. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in checkProductInWishlist API:", error);
    throw error;
  }
}
