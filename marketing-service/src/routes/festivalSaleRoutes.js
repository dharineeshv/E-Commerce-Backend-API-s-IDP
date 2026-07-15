import express from "express";

import {
    createFestivalSale,
    getAllFestivalSales,
    getFestivalSaleById,
    getActiveFestivalSale,
    updateFestivalSale,
    deleteFestivalSale
} from "../controllers/festivalSaleController.js";

import validateFestivalSaleCreate from "../middlewares/festivalSaleCreateValidation.js";

import validateFestivalSaleUpdate from "../middlewares/festivalSaleUpdateValidation.js";

const router = express.Router();

// ==========================================
// Festival Sale Routes
// ==========================================

// Create Festival Sale
router.post(
    "/festival-sales",
    validateFestivalSaleCreate,
    createFestivalSale
);

// Get All Festival Sales
router.get(
    "/festival-sales",
    getAllFestivalSales
);

// Get Active Festival Sale
router.get(
    "/festival-sales/active",
    getActiveFestivalSale
);

// Get Festival Sale By ID
router.get(
    "/festival-sales/:festivalSaleId",
    getFestivalSaleById
);

// Update Festival Sale
router.put(
    "/festival-sales/:festivalSaleId",
    validateFestivalSaleUpdate,
    updateFestivalSale
);

// Delete Festival Sale
router.delete(
    "/festival-sales/:festivalSaleId",
    deleteFestivalSale
);

export default router;