import * as couponService from "../services/couponService.js";


import {

    successResponse

} from "../utils/apiResponse.js";

const validateCoupon = async (

    req,

    res,

    next

) => {

    try {

        const {

            couponCode,

            orderAmount

        } = req.body;

        const result =

            await couponService.validateCoupon(

                couponCode,

                orderAmount

            );

        return successResponse(

            res,

            200,

            "Coupon applied successfully.",

            result

        );

    }

    catch (error) {

        next(error);

    }

};

const createCoupon = async (req, res, next) => {

    try {

        const result = await couponService.createCoupon(req.body);

      return successResponse(

    res,

    201,

    "Coupon created successfully.",

    result

);

    }

    catch (error) {

        next(error);

    }

};

const getAllCoupons = async (req, res, next) => {

    try {

        const coupons = await couponService.getAllCoupons();

        return successResponse(

    res,

    200,

    "Coupons fetched successfully.",

    coupons

);

    }

    catch (error) {

        next(error);

    }

};
const getCouponById = async (req, res, next) => {

    try {

        const coupon = await couponService.getCouponById(

            req.params.couponId

        );

      return successResponse(

    res,

    200,

    "Coupon fetched successfully.",

    coupon

);

    }

    catch (error) {

        next(error);

    }

};

const updateCoupon = async (req, res, next) => {

    try {

        const coupon = await couponService.updateCoupon(

            req.params.couponId,

            req.body

        );

      return successResponse(

    res,

    200,

    "Coupon updated successfully.",

    coupon

);

    }

    catch (error) {

        next(error);

    }

};

const deleteCoupon = async (req, res, next) => {

    try {

        const result = await couponService.deleteCoupon(

            req.params.couponId

        );

        return successResponse(

    res,

    200,

    result.message

);
    }

    catch (error) {

        next(error);

    }

};

export {

    createCoupon,

    getAllCoupons,

    getCouponById,

    updateCoupon,

    deleteCoupon,

    validateCoupon

};