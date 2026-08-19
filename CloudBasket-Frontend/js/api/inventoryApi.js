import { API } from "../config.js";

export async function getAllInventory() {

    try {

        const response = await fetch(

            `${API.inventoryService}/api/v1/inventory`

        );

        if (!response.ok) {

            throw new Error("Failed to fetch inventory.");

        }

        return await response.json();

    }

    catch (error) {

        console.error(error);

        return null;

    }

}

export async function getInventoryById(inventoryId) {
    try {
        const response = await fetch(`${API.inventoryService}/api/v1/inventory/${inventoryId}`);
        if (!response.ok) {
            if (response.status === 404) {
                return { success: false, notFound: true };
            }
            throw new Error(`Failed to fetch inventory with ID: ${inventoryId}`);
        }
        return await response.json();
    } catch (error) {
        console.warn("Inventory API lookup notice:", error.message || error);
        return null;
    }
}

export async function updateInventory(inventoryId, payload) {
    try {
        const response = await fetch(`${API.inventoryService}/api/v1/inventory/${inventoryId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.message || `Failed to update inventory with ID: ${inventoryId}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error in updateInventory:", error);
        return { success: false, message: error.message };
    }
}