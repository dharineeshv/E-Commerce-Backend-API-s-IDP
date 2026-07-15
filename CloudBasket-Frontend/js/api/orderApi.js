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