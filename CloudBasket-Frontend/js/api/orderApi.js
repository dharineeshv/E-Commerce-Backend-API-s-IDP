import { API } from "../config.js";
import { apiFetch } from "./apiClient.js";

export async function getAllOrders() {

    try {

       const response = await apiFetch(
    `${API.orderService}/api/v1/order/admin/all`
);

        if (!response.ok) {

            throw new Error("Failed to fetch orders.");

        }

        return await response.json();

    }

    catch (error) {
        console.error(error);
        return null;
    }
}

export async function updateOrderStatus(orderId, status) {
    try {
        const response = await apiFetch(
            `${API.orderService}/api/v1/order/admin/${orderId}/status`,
            {
                method: "PATCH",
                body: JSON.stringify({ status })
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to update order status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}