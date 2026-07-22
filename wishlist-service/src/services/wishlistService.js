import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import "../config/env.js";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
});

const dynamodb = DynamoDBDocumentClient.from(client);

const WISHLIST_TABLE = process.env.WISHLIST_TABLE || "Wishlist";

export const addProductToWishlist = async (customerId, productId) => {
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
};

export const getWishlist = async (customerId) => {
  const params = {
    TableName: WISHLIST_TABLE,
    KeyConditionExpression: "customerId = :customerId",
    ExpressionAttributeValues: {
      ":customerId": customerId,
    },
  };

  const data = await dynamodb.send(new QueryCommand(params));
  return data.Items || [];
};

export const checkProductInWishlist = async (customerId, productId) => {
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
};

export const removeProductFromWishlist = async (customerId, productId) => {
  const params = {
    TableName: WISHLIST_TABLE,
    Key: {
      customerId,
      productId,
    },
  };

  await dynamodb.send(new DeleteCommand(params));
  return { success: true, message: "Product removed from wishlist" };
};

export const clearWishlist = async (customerId) => {
  const items = await getWishlist(customerId);
  for (const item of items) {
    await removeProductFromWishlist(customerId, item.productId);
  }
  return { success: true, message: "Wishlist cleared" };
};
