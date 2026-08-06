import {
    PutCommand,
    GetCommand,
    ScanCommand,
    DeleteCommand,
    QueryCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "../config/aws.js";

import { env } from "../config/env.js";

const createCoupon = async (coupon) => {

    const command = new PutCommand({

        TableName: env.COUPONS_TABLE,

        Item: coupon

    });

    await dynamoDb.send(command);

    return coupon;

};

const getCouponById = async (couponId) => {

    const command = new GetCommand({

        TableName: env.COUPONS_TABLE,

        Key: {

            couponId

        }

    });

    const response = await dynamoDb.send(command);

    return response.Item;

};

const getCouponByCode = async (couponCode) => {

    const command = new QueryCommand({

        TableName: env.COUPONS_TABLE,

        IndexName: "couponCode-index",

        KeyConditionExpression:
            "couponCode = :couponCode",

        ExpressionAttributeValues: {

            ":couponCode": couponCode

        }

    });

    const response = await dynamoDb.send(command);

    return response.Items[0];

};

const getAllCoupons = async () => {

    const command = new ScanCommand({

        TableName: env.COUPONS_TABLE

    });

    const response = await dynamoDb.send(command);

    return response.Items;

};

const deleteCoupon = async (couponId) => {

    const command = new DeleteCommand({

        TableName: env.COUPONS_TABLE,

        Key: {

            couponId

        }

    });

    await dynamoDb.send(command);

};

// ==========================================
// Update Coupon
// ==========================================

const updateCoupon = async (coupon) => {

    const command = new UpdateCommand({

        TableName: env.COUPONS_TABLE,

        Key: {

            couponId: coupon.couponId

        },

        UpdateExpression: `
            SET
                couponCode = :couponCode,
                title = :title,
                description = :description,
                discountType = :discountType,
                discountValue = :discountValue,
                minimumOrderAmount = :minimumOrderAmount,
                maximumDiscount = :maximumDiscount,
                usageLimit = :usageLimit,
                usedCount = :usedCount,
                startDate = :startDate,
                expiryDate = :expiryDate,
                #status = :status,
                updatedAt = :updatedAt
        `,

        ExpressionAttributeNames: {

            "#status": "status"

        },

        ExpressionAttributeValues: {

            ":couponCode": coupon.couponCode,

            ":title": coupon.title,

            ":description": coupon.description,

            ":discountType": coupon.discountType,

            ":discountValue": coupon.discountValue,

            ":minimumOrderAmount": coupon.minimumOrderAmount,

            ":maximumDiscount": coupon.maximumDiscount,

            ":usageLimit": coupon.usageLimit,

            ":usedCount": coupon.usedCount,

            ":startDate": coupon.startDate,

            ":expiryDate": coupon.expiryDate,

            ":status": coupon.status,

            ":updatedAt": coupon.updatedAt

        },

        ReturnValues: "ALL_NEW"

    });

    const response = await dynamoDb.send(command);

    return response.Attributes;

};

export {

    createCoupon,

    getCouponById,

    getCouponByCode,

    getAllCoupons,

    updateCoupon,

    deleteCoupon

};