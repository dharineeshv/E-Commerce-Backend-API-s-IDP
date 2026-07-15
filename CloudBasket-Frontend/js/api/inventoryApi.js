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