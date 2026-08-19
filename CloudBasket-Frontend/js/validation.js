// ==========================================
// CloudBasket Product Validation Module
// ==========================================

/**
 * Validates the product form data before API submission
 * @param {Object} data - The product state object
 * @returns {Array} Array of error messages (empty if valid)
 */
export function validateProduct(data) {
    const errors = [];

    if (!data.name || !data.name.trim()) {
        errors.push("Product Name is required.");
    }

    if (!data.brand || !data.brand.trim()) {
        errors.push("Brand is required.");
    }

    if (!data.category || !data.category.trim()) {
        errors.push("Category is required.");
    }

    if (!data.sku || !data.sku.trim()) {
        errors.push("SKU is required.");
    }

    // MRP Validation
    if (data.mrp === undefined || data.mrp === null || data.mrp === '') {
        errors.push("MRP Price is required.");
    } else {
        const mrpNum = Number(data.mrp);
        if (isNaN(mrpNum) || mrpNum <= 0) {
            errors.push("MRP Price must be a number greater than zero.");
        }
    }

    // Discount Validation
    if (data.discountPercentage !== undefined && data.discountPercentage !== null && data.discountPercentage !== '') {
        const discountNum = Number(data.discountPercentage);
        if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
            errors.push("Discount Percentage must be a number between 0 and 100.");
        }
    }

    // Quantity Validation
    if (data.quantity === undefined || data.quantity === null || data.quantity === '') {
        errors.push("Stock Quantity is required.");
    } else {
        const qtyNum = Number(data.quantity);
        if (isNaN(qtyNum) || qtyNum < 0) {
            errors.push("Stock Quantity must be a non-negative number.");
        }
    }

    // Low Stock Threshold Validation
    if (data.lowStockThreshold !== undefined && data.lowStockThreshold !== null && data.lowStockThreshold !== '') {
        const thresholdNum = Number(data.lowStockThreshold);
        if (isNaN(thresholdNum) || thresholdNum < 0) {
            errors.push("Low Stock Threshold must be a non-negative number.");
        }
    }

    return errors;
}
