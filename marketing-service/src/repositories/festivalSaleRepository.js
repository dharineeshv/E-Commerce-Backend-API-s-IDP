import {
    PutCommand,
    GetCommand,
    ScanCommand,
    DeleteCommand,
    UpdateCommand,
    QueryCommand
} from "@aws-sdk/lib-dynamodb";

import { dynamoDb } from "../config/aws.js";

import { env } from "../config/env.js";

// ==========================================
// Create Festival Sale
// ==========================================

const createFestivalSale = async (festivalSale) => {

    const command = new PutCommand({

        TableName: env.FESTIVAL_SALES_TABLE,

        Item: festivalSale

    });

    await dynamoDb.send(command);

    return festivalSale;

};

// ==========================================
// Get Festival Sale By ID
// ==========================================

const getFestivalSaleById = async (festivalSaleId) => {

    const command = new GetCommand({

        TableName: env.FESTIVAL_SALES_TABLE,

        Key: {

            festivalSaleId

        }

    });

    const response = await dynamoDb.send(command);

    return response.Item;

};

// ==========================================
// Get All Festival Sales
// ==========================================

const getAllFestivalSales = async () => {

    const command = new ScanCommand({

        TableName: env.FESTIVAL_SALES_TABLE

    });

    const response = await dynamoDb.send(command);

    return response.Items || [];

};


// ==========================================
// Get Active Festival Sale
// ==========================================

const getActiveFestivalSale = async () => {

    const command = new QueryCommand({

        TableName: env.FESTIVAL_SALES_TABLE,

        IndexName: "status-index",

        KeyConditionExpression: "#status = :status",

        ExpressionAttributeNames: {

            "#status": "status"

        },

        ExpressionAttributeValues: {

            ":status": "ACTIVE"

        }

    });

    const response = await dynamoDb.send(command);

    return response.Items || [];

};

// ==========================================
// Update Festival Sale
// ==========================================

const updateFestivalSale = async (festivalSale) => {

    const command = new UpdateCommand({

        TableName: env.FESTIVAL_SALES_TABLE,

        Key: {

            festivalSaleId: festivalSale.festivalSaleId

        },

        UpdateExpression: `
            SET
                title = :title,
                subtitle = :subtitle,
                bannerImageUrl = :bannerImageUrl,
                discountType = :discountType,
                discountValue = :discountValue,
                startDate = :startDate,
                endDate = :endDate,
                #status = :status,
                displayOrder = :displayOrder,
                isFeatured = :isFeatured,
                updatedAt = :updatedAt
        `,

        ExpressionAttributeNames: {

            "#status": "status"

        },

        ExpressionAttributeValues: {

            ":title": festivalSale.title,

            ":subtitle": festivalSale.subtitle,

            ":bannerImageUrl": festivalSale.bannerImageUrl,

            ":discountType": festivalSale.discountType,

            ":discountValue": festivalSale.discountValue,

            ":startDate": festivalSale.startDate,

            ":endDate": festivalSale.endDate,

            ":status": festivalSale.status,

            ":displayOrder": festivalSale.displayOrder,

            ":isFeatured": festivalSale.isFeatured,

            ":updatedAt": festivalSale.updatedAt

        },

        ReturnValues: "ALL_NEW"

    });

    const response = await dynamoDb.send(command);

    return response.Attributes;

};

// ==========================================
// Delete Festival Sale
// ==========================================

const deleteFestivalSale = async (festivalSaleId) => {

    const command = new DeleteCommand({

        TableName: env.FESTIVAL_SALES_TABLE,

        Key: {

            festivalSaleId

        }

    });

    await dynamoDb.send(command);

};


export {

    createFestivalSale,

    getFestivalSaleById,

    getAllFestivalSales,

    getActiveFestivalSale,

    updateFestivalSale,

    deleteFestivalSale

};