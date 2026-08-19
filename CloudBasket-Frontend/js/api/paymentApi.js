import { API } from "../config.js";
import { apiFetch } from "./apiClient.js";

export async function getAllAdminPayments() {
    try {
        const response = await apiFetch(
            `${API.paymentService}/api/v1/payment`
        );
        if (!response.ok) {
            throw new Error("Failed to fetch payments.");
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function refundPayment(paymentId) {
    try {
        const response = await apiFetch(
            `${API.paymentService}/api/v1/payment/${paymentId}/refund`,
            {
                method: "PUT",
                body: JSON.stringify({})
            }
        );
        if (!response.ok) {
            throw new Error(`Failed to refund payment: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Refund Error:", error);
        return null;
    }
}
