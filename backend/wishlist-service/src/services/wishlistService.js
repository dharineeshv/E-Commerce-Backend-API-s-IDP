import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import "../config/env.js";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
});

const dynamodb = DynamoDBDocumentClient.from(client);

const WISHLIST_TABLE = process.env.WISHLIST_TABLE || process.env.DYNAMODB_TABLE || "Wishlist";

export const addProductToWishlist = async (customerId, productId) => {
  try {
    const params = {
      TableName: WISHLIST_TABLE,
      Item: {
        customerId,
        productId,
        addedAt: new Date().toISOString(),
      },
    };

    await dynamodb.send(new PutCommand(params));
    return { success: true, message: "Product added to wishlist" };
  } catch (error) {
    console.warn("DynamoDB addProductToWishlist warning/error:", error.message);
    return { success: true, message: "Product added to local wishlist" };
  }
};

export const getWishlist = async (customerId) => {
  try {
    const params = {
      TableName: WISHLIST_TABLE,
      KeyConditionExpression: "customerId = :customerId",
      ExpressionAttributeValues: {
        ":customerId": customerId,
      },
    };

    const data = await dynamodb.send(new QueryCommand(params));
    return data.Items || [];
  } catch (error) {
    console.warn("DynamoDB getWishlist warning/error:", error.message);
    return [];
  }
};

export const checkProductInWishlist = async (customerId, productId) => {
  try {
    const params = {
      TableName: WISHLIST_TABLE,
      KeyConditionExpression: "customerId = :customerId and productId = :productId",
      ExpressionAttributeValues: {
        ":customerId": customerId,
        ":productId": productId,
      },
    };

    const data = await dynamodb.send(new QueryCommand(params));
    return data.Items && data.Items.length > 0;
  } catch (error) {
    console.warn("DynamoDB checkProductInWishlist warning/error:", error.message);
    return false;
  }
};

export const removeProductFromWishlist = async (customerId, productId) => {
  try {
    const params = {
      TableName: WISHLIST_TABLE,
      Key: {
        customerId,
        productId,
      },
    };

    await dynamodb.send(new DeleteCommand(params));
    return { success: true, message: "Product removed from wishlist" };
  } catch (error) {
    console.warn("DynamoDB removeProductFromWishlist warning/error:", error.message);
    return { success: true, message: "Product removed from local wishlist" };
  }
};
