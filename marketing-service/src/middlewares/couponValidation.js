import AppError from "../utils/AppError.js";
import {

    DISCOUNT_TYPES,

    COUPON_STATUS

} from "../constants/coupon.js";

const validateCoupon = (req, res, next) => {

    const {

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

    } = req.body;

    // ==========================================
    // Required Fields
    // ==========================================

    if (!couponCode || couponCode.trim() === "") {

        return next(

            new AppError(

                "Coupon code is required.",

                400

            )

        );

    }

    if (!title || title.trim() === "") {

        return next(

            new AppError(

                "Coupon title is required.",

                400

            )

        );

    }

    if (!description || description.trim() === "") {

        return next(

            new AppError(

                "Coupon description is required.",

                400

            )

        );

    }

    // ==========================================
    // Discount Type
    // ==========================================
if (

    discountType !== DISCOUNT_TYPES.PERCENTAGE &&

    discountType !== DISCOUNT_TYPES.FLAT

) {

        return next(

            new AppError(

                "Discount type must be PERCENTAGE or FLAT.",

                400

            )

        );

    }

    // ==========================================
    // Discount Value
    // ==========================================

    if (

        typeof discountValue !== "number" ||

        discountValue <= 0

    ) {

        return next(

            new AppError(

                "Discount value must be greater than zero.",

                400

            )

        );

    }

    // ==========================================
    // Minimum Order
    // ==========================================

    if (

        typeof minimumOrderAmount !== "number" ||

        minimumOrderAmount < 0

    ) {

        return next(

            new AppError(

                "Minimum order amount is invalid.",

                400

            )

        );

    }

    // ==========================================
    // Maximum Discount
    // ==========================================

    if (

        typeof maximumDiscount !== "number" ||

        maximumDiscount < 0

    ) {

        return next(

            new AppError(

                "Maximum discount is invalid.",

                400

            )

        );

    }

    // ==========================================
    // Usage Limit
    // ==========================================

    if (

        typeof usageLimit !== "number" ||

        usageLimit <= 0

    ) {

        return next(

            new AppError(

                "Usage limit must be greater than zero.",

                400

            )

        );

    }

    // ==========================================
    // Dates
    // ==========================================

    if (!startDate || !expiryDate) {

        return next(

            new AppError(

                "Start date and expiry date are required.",

                400

            )

        );

    }

    if (

        new Date(startDate) >=

        new Date(expiryDate)

    ) {

        return next(

            new AppError(

                "Expiry date must be greater than start date.",

                400

            )

        );

    }

    // ==========================================
    // Status
    // ==========================================

    const validStatus = Object.values(COUPON_STATUS);

    if (

        !validStatus.includes(status)

    ) {

        return next(

            new AppError(

                "Invalid coupon status.",

                400

            )

        );

    }

    next();

};

export default validateCoupon;