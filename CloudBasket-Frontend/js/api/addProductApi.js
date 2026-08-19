import { apiFetch } from "./apiClient.js";
import { API } from "../config.js";

/**
 * ==========================================
 * Upload Product Image
 * ==========================================
 */
export async function uploadProductImage(imageFile) {

    const formData = new FormData();

    formData.append("image", imageFile);

    const token = localStorage.getItem("accessToken");

    const response = await fetch(
        `${API.productService}/api/v1/products/upload-image`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        }
    );

    return await response.json();

}

/**
 * ==========================================
 * Create Product
 * ==========================================
 */
export async function createProduct(product) {

    const response = await apiFetch(

        `${API.productService}/api/v1/products`,

        {
            method: "POST",

            body: JSON.stringify(product)
        }

    );

    return await response.json();

}