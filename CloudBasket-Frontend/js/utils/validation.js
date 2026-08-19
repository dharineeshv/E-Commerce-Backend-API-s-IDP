import { showToast } from "./toast.js";

export function validateProduct(data) {

    if (!data.name.trim()) {

        showToast("Product Name is required.", "error");

        return false;

    }

    if (!data.brand.trim()) {

        showToast("Brand is required.", "error");

        return false;

    }

    if (!data.category.trim()) {

        showToast("Category is required.", "error");

        return false;

    }

    if (!data.sku.trim()) {

        showToast("SKU is required.", "error");

        return false;

    }

    if (Number(data.mrp) <= 0) {

        showToast("Invalid MRP.", "error");

        return false;

    }

    if (Number(data.quantity) < 0) {

        showToast("Invalid Quantity.", "error");

        return false;

    }

    return true;

}
