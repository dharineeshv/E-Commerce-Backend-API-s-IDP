import express from "express";

import {

    createCoupon,

    getAllCoupons,

    getCouponById,

    updateCoupon,

    deleteCoupon,

    validateCoupon

} from "../controllers/couponController.js";

import validateCouponRequest from "../middlewares/couponValidation.js";

const router = express.Router();

// ==========================================
// Coupon Routes
// ==========================================

router.post(

    "/coupons/validate",

    validateCoupon
);

// Create Coupon
router.post(
    "/coupons",
    validateCouponRequest,
    createCoupon
);

// Get All Coupons
router.get("/coupons", getAllCoupons);

// Get Coupon By ID
router.get("/coupons/:couponId", getCouponById);

// Update Coupon
router.put("/coupons/:couponId", updateCoupon);

// Delete Coupon
router.delete("/coupons/:couponId", deleteCoupon);

export default router;