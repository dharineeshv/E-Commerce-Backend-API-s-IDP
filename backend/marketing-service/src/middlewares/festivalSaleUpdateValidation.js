import AppError from "../utils/AppError.js";

import {
    DISCOUNT_TYPES
} from "../constants/coupon.js";

import {
    FESTIVAL_SALE_STATUS
} from "../constants/festivalSale.js";

const validateFestivalSaleUpdate = (req, res, next) => {

    const {

        title,
        subtitle,
        bannerImageUrl,
        discountType,
        discountValue,
        startDate,
        endDate,
        status,
        displayOrder,
        isFeatured

    } = req.body;

    if (
        title !== undefined &&
        title.trim() === ""
    ) {
        return next(new AppError("Title cannot be empty.", 400));
    }

    if (
        subtitle !== undefined &&
        subtitle.trim() === ""
    ) {
        return next(new AppError("Subtitle cannot be empty.", 400));
    }

    if (
        bannerImageUrl !== undefined &&
        bannerImageUrl.trim() === ""
    ) {
        return next(new AppError("Banner image URL cannot be empty.", 400));
    }

    if (
        discountType !== undefined &&
        discountType !== DISCOUNT_TYPES.PERCENTAGE &&
        discountType !== DISCOUNT_TYPES.FLAT
    ) {
        return next(new AppError("Invalid discount type.", 400));
    }

    if (
        discountValue !== undefined &&
        (
            typeof discountValue !== "number" ||
            discountValue <= 0
        )
    ) {
        return next(new AppError("Invalid discount value.", 400));
    }

    if (
        startDate &&
        endDate &&
        new Date(startDate) >= new Date(endDate)
    ) {
        return next(new AppError("End date must be greater than Start date.", 400));
    }

    if (
        status !== undefined &&
        status !== FESTIVAL_SALE_STATUS.ACTIVE &&
        status !== FESTIVAL_SALE_STATUS.INACTIVE
    ) {
        return next(new AppError("Invalid status.", 400));
    }

    if (
        displayOrder !== undefined &&
        (
            typeof displayOrder !== "number" ||
            displayOrder < 1
        )
    ) {
        return next(new AppError("Invalid display order.", 400));
    }

    if (
        isFeatured !== undefined &&
        typeof isFeatured !== "boolean"
    ) {
        return next(new AppError("isFeatured must be boolean.", 400));
    }

    next();

};

export default validateFestivalSaleUpdate;