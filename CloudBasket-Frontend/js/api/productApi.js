import { API } from "../config.js";
import { apiFetch } from "./apiClient.js";

export async function fetchProducts() {
    try {
        const response = await apiFetch(`${API.productService}/api/v1/products`);
        if (!response.ok) {
            throw new Error("Failed to fetch products.");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

export const getAllProducts = fetchProducts;

export async function getProductById(id) {
    try {
        const response = await apiFetch(`${API.productService}/api/v1/products/${id}`);
        if (!response.ok) {
            throw new Error("Failed to fetch product.");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function updateProductApi(id, product) {
    try {
        const response = await apiFetch(`${API.productService}/api/v1/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        });
        if (!response.ok) {
            throw new Error("Failed to update product.");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function deleteProductApi(id) {
    try {
        const response = await apiFetch(`${API.productService}/api/v1/products/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error("Failed to delete product.");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}
