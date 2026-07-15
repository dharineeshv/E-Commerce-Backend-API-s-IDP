import { API } from "../config.js";

export async function getActiveFestivalSale() {

    try {

        const response = await fetch(

            `${API.marketingService}/api/v1/marketing/festival-sales/active`

        );

        if (!response.ok) {

            throw new Error("Failed to fetch active festival.");

        }

        return await response.json();

    }

    catch (error) {

        console.error(error);

        return null;

    }

}