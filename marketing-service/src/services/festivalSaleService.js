import { v4 as uuidv4 } from "uuid";

import * as festivalSaleRepository from "../repositories/festivalSaleRepository.js";

import AppError from "../utils/AppError.js";

import { FESTIVAL_SALE_STATUS } from "../constants/festivalSale.js";

import { DISCOUNT_TYPES } from "../constants/coupon.js";

// ==========================================
// Create Festival Sale
// ==========================================

const createFestivalSale = async (festivalSaleData) => {

    let {

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

    } = festivalSaleData;

    // ==========================================
    // Validate Discount Type
    // ==========================================

    if (

        discountType !== DISCOUNT_TYPES.PERCENTAGE &&

        discountType !== DISCOUNT_TYPES.FLAT

    ) {

        throw new AppError(

            "Invalid discount type.",

            400

        );

    }

    // ==========================================
    // Validate Discount Value
    // ==========================================

    if (discountValue <= 0) {

        throw new AppError(

            "Discount value must be greater than zero.",

            400

        );

    }

    // ==========================================
    // Validate Dates
    // ==========================================

    if (

        new Date(startDate) >=

        new Date(endDate)

    ) {

        throw new AppError(

            "End date must be greater than start date.",

            400

        );

    }

    // ==========================================
    // Only One Active Festival Sale
    // ==========================================

    if (status === FESTIVAL_SALE_STATUS.ACTIVE) {

        const activeFestivalSales =

            await festivalSaleRepository.getActiveFestivalSale();

        if (activeFestivalSales.length > 0) {

            const currentActiveSale = activeFestivalSales[0];

            currentActiveSale.status =

                FESTIVAL_SALE_STATUS.INACTIVE;

            currentActiveSale.updatedAt =

                new Date().toISOString();

            await festivalSaleRepository.updateFestivalSale(

                currentActiveSale

            );

        }

    }

    // ==========================================
    // Create Festival Sale
    // ==========================================

    const festivalSale = {

        festivalSaleId: uuidv4(),

        title,

        subtitle,

        bannerImageUrl,

        discountType,

        discountValue,

        startDate,

        endDate,

        status,

        displayOrder,

        isFeatured,

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()

    };

    return await festivalSaleRepository.createFestivalSale(

        festivalSale

    );

};

// ==========================================
// Get All Festival Sales
// ==========================================

const getAllFestivalSales = async () => {

    return await festivalSaleRepository.getAllFestivalSales();

};

// ==========================================
// Get Festival Sale By ID
// ==========================================

const getFestivalSaleById = async (festivalSaleId) => {

    const festivalSale =

        await festivalSaleRepository.getFestivalSaleById(

            festivalSaleId

        );

    if (!festivalSale) {

        throw new AppError(

            "Festival sale not found.",

            404

        );

    }

    return festivalSale;

};

// ==========================================
// Get Active Festival Sale
// ==========================================

const getActiveFestivalSale = async () => {

    const activeFestivalSales =

        await festivalSaleRepository.getActiveFestivalSale();

    if (activeFestivalSales.length === 0) {

        throw new AppError(

            "No active festival sale found.",

            404

        );

    }

    return activeFestivalSales[0];

};

// ==========================================
// Update Festival Sale
// ==========================================

const updateFestivalSale = async (

    festivalSaleId,

    festivalSaleData

) => {

    const existingFestivalSale =

        await festivalSaleRepository.getFestivalSaleById(

            festivalSaleId

        );

    if (!existingFestivalSale) {

        throw new AppError(

            "Festival sale not found.",

            404

        );

    }

    // ==========================================
    // Only One Active Festival Sale
    // ==========================================

    if (

        festivalSaleData.status ===

        FESTIVAL_SALE_STATUS.ACTIVE

    ) {

        const activeFestivalSales =

            await festivalSaleRepository.getActiveFestivalSale();

        if (

            activeFestivalSales.length > 0 &&

            activeFestivalSales[0].festivalSaleId !==

            festivalSaleId

        ) {

            activeFestivalSales[0].status =

                FESTIVAL_SALE_STATUS.INACTIVE;

            activeFestivalSales[0].updatedAt =

                new Date().toISOString();

            await festivalSaleRepository.updateFestivalSale(

                activeFestivalSales[0]

            );

        }

    }

    const updatedFestivalSale = {

        ...existingFestivalSale,

        ...festivalSaleData,

        festivalSaleId,

        updatedAt: new Date().toISOString()

    };

    return await festivalSaleRepository.updateFestivalSale(

        updatedFestivalSale

    );

};

// ==========================================
// Delete Festival Sale
// ==========================================

const deleteFestivalSale = async (

    festivalSaleId

) => {

    const festivalSale =

        await festivalSaleRepository.getFestivalSaleById(

            festivalSaleId

        );

    if (!festivalSale) {

        throw new AppError(

            "Festival sale not found.",

            404

        );

    }

    await festivalSaleRepository.deleteFestivalSale(

        festivalSaleId

    );

    return {

        message:

            "Festival sale deleted successfully."

    };

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