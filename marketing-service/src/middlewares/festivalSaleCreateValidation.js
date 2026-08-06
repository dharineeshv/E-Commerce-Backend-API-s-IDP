import AppError from "../utils/AppError.js";

import {
    DISCOUNT_TYPES
} from "../constants/coupon.js";

import {
    FESTIVAL_SALE_STATUS
} from "../constants/festivalSale.js";

const validateFestivalSaleCreate = (req, res, next) => {

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

    if (!title || title.trim() === "") {
        return next(new AppError("Title is required.", 400));
    }

    if (!subtitle || subtitle.trim() === "") {
        return next(new AppError("Subtitle is required.", 400));
    }

    if (!bannerImageUrl || bannerImageUrl.trim() === "") {
        return next(new AppError("Banner image URL is required.", 400));
    }

    if (
        discountType !== DISCOUNT_TYPES.PERCENTAGE &&
        discountType !== DISCOUNT_TYPES.FLAT
    ) {
        return next(new AppError("Invalid discount type.", 400));
    }

    if (
        typeof discountValue !== "number" ||
        discountValue <= 0
    ) {
        return next(new AppError("Invalid discount value.", 400));
    }

    if (!startDate || !endDate) {
        return next(new AppError("Start date and End date are required.", 400));
    }

    if (new Date(startDate) >= new Date(endDate)) {
        return next(new AppError("End date must be greater than Start date.", 400));
    }

    if (
        status !== FESTIVAL_SALE_STATUS.ACTIVE &&
        status !== FESTIVAL_SALE_STATUS.INACTIVE
    ) {
        return next(new AppError("Invalid status.", 400));
    }

    if (
        typeof displayOrder !== "number" ||
        displayOrder < 1
    ) {
        return next(new AppError("Display order must be greater than 0.", 400));
    }

    if (typeof isFeatured !== "boolean") {
        return next(new AppError("isFeatured must be boolean.", 400));
    }

    next();

};

export default validateFestivalSaleCreate;