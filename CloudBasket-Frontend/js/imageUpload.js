// ==========================================
// CloudBasket S3 Image Upload Module
// ==========================================

import { API } from './config.js';

/**
 * Uploads a product image to Amazon S3 via the Product Service Lambda/Express backend.
 * @param {File} file - The file to upload
 * @param {string} accessToken - Cognito JWT access token
 * @returns {Promise<Object>} Object containing imageUrl and imageKey
 */
export async function uploadProductImage(file, accessToken) {
    if (!file) {
        throw new Error("No image file selected.");
    }

    const formData = new FormData();
    formData.append("image", file); // Key must match multer: upload.single("image")

    const url = `${API.productService}/api/v1/products/upload-image`;
    
    const headers = {
        "Authorization": `Bearer ${accessToken}`
        // CRITICAL: Do NOT manually set Content-Type header to "multipart/form-data"
        // so that the browser automatically generates it with the boundary parameter.
    };

    const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData
    });

    // Check response status
    if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized request. Please log in again.");
    }

    let data;
    try {
        data = await response.json();
    } catch (e) {
        throw new Error(`Server returned invalid response structure (HTTP ${response.status}).`);
    }

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to upload image to S3.");
    }

    return {
        imageUrl: data.imageUrl,
        imageKey: data.imageKey
    };
}
