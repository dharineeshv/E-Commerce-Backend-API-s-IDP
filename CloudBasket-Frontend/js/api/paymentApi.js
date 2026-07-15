import { API } from "../config.js";

export async function getAllProducts() {

    try {

        const response = await fetch(

            `${API.productService}/api/v1/products`

        );

        if (!response.ok) {

            throw new Error("Failed to fetch products.");

        }

        return await response.json();

    }

    catch (error) {

        console.error(error);

        return null;

    }

}