import * as festivalSaleService from "../services/festivalSaleService.js";

import { successResponse } from "../utils/apiResponse.js";

// ==========================================
// Create Festival Sale
// ==========================================

const createFestivalSale = async (req, res, next) => {

    try {

        const result = await festivalSaleService.createFestivalSale(req.body);

        return successResponse(

            res,

            201,

            "Festival sale created successfully.",

            result

        );

    }

    catch (error) {

        next(error);

    }

};

// ==========================================
// Get All Festival Sales
// ==========================================

const getAllFestivalSales = async (req, res, next) => {

    try {

        const festivalSales =

            await festivalSaleService.getAllFestivalSales();

        return successResponse(

            res,

            200,

            "Festival sales fetched successfully.",

            festivalSales

        );

    }

    catch (error) {

        next(error);

    }

};

// ==========================================
// Get Festival Sale By ID
// ==========================================

const getFestivalSaleById = async (req, res, next) => {

    try {

        const festivalSale =

            await festivalSaleService.getFestivalSaleById(

                req.params.festivalSaleId

            );

        return successResponse(

            res,

            200,

            "Festival sale fetched successfully.",

            festivalSale

        );

    }

    catch (error) {

        next(error);

    }

};

// ==========================================
// Get Active Festival Sale
// ==========================================

const getActiveFestivalSale = async (req, res, next) => {

    try {

        const festivalSale =

            await festivalSaleService.getActiveFestivalSale();

        return successResponse(

            res,

            200,

            "Active festival sale fetched successfully.",

            festivalSale

        );

    }

    catch (error) {

        next(error);

    }

};

// ==========================================
// Update Festival Sale
// ==========================================

const updateFestivalSale = async (req, res, next) => {

    try {

        const festivalSale =

            await festivalSaleService.updateFestivalSale(

                req.params.festivalSaleId,

                req.body

            );

        return successResponse(

            res,

            200,

            "Festival sale updated successfully.",

            festivalSale

        );

    }

    catch (error) {

        next(error);

    }

};

// ==========================================
// Delete Festival Sale
// ==========================================

const deleteFestivalSale = async (req, res, next) => {

    try {

        const result =

            await festivalSaleService.deleteFestivalSale(

                req.params.festivalSaleId

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

// ==========================================
// Exports
// ==========================================

export {

    createFestivalSale,

    getAllFestivalSales,

    getFestivalSaleById,

    getActiveFestivalSale,

    updateFestivalSale,

    deleteFestivalSale

};