import { v4 as uuidv4 } from "uuid";

import * as couponRepository from "../repositories/couponRepository.js";

import AppError from "../utils/AppError.js";

import {
    DISCOUNT_TYPES,
    COUPON_STATUS
} from "../constants/coupon.js";

// ==========================================
// Validate Coupon
// ==========================================

const validateCoupon = async (couponCode, orderAmount) => {

    const normalizedCouponCode = couponCode.trim().toUpperCase();

    const coupon = await couponRepository.getCouponByCode(normalizedCouponCode);

    if (!coupon) {
        throw new AppError("Coupon not found.", 404);
    }

    if (coupon.status !== COUPON_STATUS.ACTIVE) {
        throw new AppError("Coupon is inactive.", 400);
    }

    const today = new Date();

    if (today > new Date(coupon.expiryDate)) {
        throw new AppError("Coupon has expired.", 400);
    }

    if (coupon.usedCount >= coupon.usageLimit) {
        throw new AppError("Coupon usage limit exceeded.", 400);
    }

    if (orderAmount < coupon.minimumOrderAmount) {
        throw new AppError(
            `Minimum order amount is ₹${coupon.minimumOrderAmount}.`,
            400
        );
    }

    let discount = 0;

    if (coupon.discountType === DISCOUNT_TYPES.PERCENTAGE) {

        discount =
            (orderAmount * coupon.discountValue) / 100;

        if (discount > coupon.maximumDiscount) {
            discount = coupon.maximumDiscount;
        }

    } else {

        discount = Math.min(
            coupon.discountValue,
            orderAmount
        );

    }

    return {

        couponCode: coupon.couponCode,

        discount,

        finalAmount: Math.max(orderAmount - discount, 0)

    };

};

// ==========================================
// Create Coupon
// ==========================================

const createCoupon = async (couponData) => {

    let {

        couponCode,

        title,

        description,

        discountType,

        discountValue,

        minimumOrderAmount,

        maximumDiscount,

        usageLimit,

        startDate,

        expiryDate,

        status

    } = couponData;

    couponCode = couponCode.trim().toUpperCase();

    const existingCoupon =
        await couponRepository.getCouponByCode(couponCode);

    if (existingCoupon) {

        throw new AppError(
            "Coupon code already exists.",
            409
        );

    }

    if (
        discountType !== DISCOUNT_TYPES.PERCENTAGE &&
        discountType !== DISCOUNT_TYPES.FLAT
    ) {

        throw new AppError(
            "Invalid discount type.",
            400
        );

    }

    if (discountValue <= 0) {

        throw new AppError(
            "Discount value must be greater than zero.",
            400
        );

    }

    if (minimumOrderAmount < 0) {

        throw new AppError(
            "Minimum order amount cannot be negative.",
            400
        );

    }

    if (maximumDiscount < 0) {

        throw new AppError(
            "Maximum discount cannot be negative.",
            400
        );

    }

    if (usageLimit <= 0) {

        throw new AppError(
            "Usage limit must be greater than zero.",
            400
        );

    }

    if (new Date(startDate) >= new Date(expiryDate)) {

        throw new AppError(
            "Expiry date must be greater than start date.",
            400
        );

    }

    const coupon = {

        couponId: uuidv4(),

        couponCode,

        title,

        description,

        discountType,

        discountValue,

        minimumOrderAmount,

        maximumDiscount,

        usageLimit,

        usedCount: 0,

        startDate,

        expiryDate,

        status,

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()

    };

    return await couponRepository.createCoupon(coupon);

};

// ==========================================
// Get All Coupons
// ==========================================

const getAllCoupons = async () => {

    return await couponRepository.getAllCoupons();

};

// ==========================================
// Get Coupon By ID
// ==========================================

const getCouponById = async (couponId) => {

    const coupon =
        await couponRepository.getCouponById(couponId);

    if (!coupon) {

        throw new AppError(
            "Coupon not found.",
            404
        );

    }

    return coupon;

};

// ==========================================
// Update Coupon
// ==========================================

const updateCoupon = async (couponId, couponData) => {

    const existingCoupon =
        await couponRepository.getCouponById(couponId);

    if (!existingCoupon) {

        throw new AppError(
            "Coupon not found.",
            404
        );

    }

    if (couponData.couponCode) {

        couponData.couponCode =
            couponData.couponCode.trim().toUpperCase();

    }

    const updatedCoupon = {

        ...existingCoupon,

        ...couponData,

        couponId,

        updatedAt: new Date().toISOString()

    };

    return await couponRepository.updateCoupon(updatedCoupon);

};

// ==========================================
// Delete Coupon
// ==========================================

const deleteCoupon = async (couponId) => {

    const coupon =
        await couponRepository.getCouponById(couponId);

    if (!coupon) {

        throw new AppError(
            "Coupon not found.",
            404
        );

    }

    await couponRepository.deleteCoupon(couponId);

    return {

        message: "Coupon deleted successfully."

    };

};

// ==========================================
// Exports
// ==========================================

export {

    createCoupon,

    getAllCoupons,

    getCouponById,

    updateCoupon,

    deleteCoupon,

    validateCoupon

};