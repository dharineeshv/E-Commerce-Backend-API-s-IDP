import { API } from "../config.js";

export async function getActiveFestivalSale() {
    try {
        const response = await fetch(
            `${API.marketingService}/api/v1/marketing/festival-sales/active`
        );

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        return null;
    }
}
