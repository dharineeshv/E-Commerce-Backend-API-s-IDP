try {
  const dotenv = await import('dotenv');
  if (dotenv && dotenv.default) dotenv.default.config();
} catch (e) {}

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3Client.js";
import path from "path";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb'

import { v4 as uuidv4 } from 'uuid';
import AWSXRay from 'aws-xray-sdk';

const REGION = process.env.AWS_REGION || "ap-southeast-1";
const dynamoRawClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoRawClient);
const tableName = process.env.DYNAMODB_TABLE || process.env.PRODUCTS_TABLE || "Dharineesh_products";

// ==========================================================
// Upload Image To S3
// ==========================================================

export async function uploadImageToS3(file) {

 const extension =
  path.extname(file.originalname) ||
  `.${file.mimetype.split("/")[1]}`;

  const fileName = `products/${uuidv4()}${extension}`;

  await s3Client.send(
    new PutObjectCommand({

      Bucket: process.env.S3_BUCKET_NAME,

      Key: fileName,

      Body: Buffer.from(file.buffer),

      ContentType: file.mimetype,

    })
  );

  return {

    imageKey: fileName,

    imageUrl:
      `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`

  };

}

export async function createProduct(productData) {
  // ==========================================
// Validation
// ==========================================

if (!productData.name?.trim()) {
  throw new Error("Product name is required.");
}

if (!productData.brand?.trim()) {
  throw new Error("Brand is required.");
}

if (!productData.category?.trim()) {
  throw new Error("Category is required.");
}

if (!productData.sku?.trim()) {
  throw new Error("SKU is required.");
}

if (productData.mrp === undefined || Number(productData.mrp) <= 0) {
  throw new Error("MRP must be greater than zero.");
}

if (
  productData.discountPercentage !== undefined &&
  (Number(productData.discountPercentage) < 0 ||
    Number(productData.discountPercentage) > 100)
) {
  throw new Error("Discount must be between 0 and 100.");
}

if (productData.quantity === undefined || Number(productData.quantity) < 0) {
  throw new Error("Quantity cannot be negative.");
}

  const mrp = Number(productData.mrp);

  const discountPercentage =
    Number(productData.discountPercentage ?? 0);

  const sellingPrice =
    Number(
      productData.sellingPrice ??
      (mrp - (mrp * discountPercentage) / 100)
    );

  const product = {

    productId: uuidv4(),

    name: productData.name,

    description: productData.description || "",

    brand: productData.brand || "",

    category: productData.category || "General",

    sku: productData.sku || "",

    mrp,

    discountPercentage,

    sellingPrice,

    quantity: Number(productData.quantity),

    lowStockThreshold:
      Number(productData.lowStockThreshold ?? 10),

    imageKey: productData.imageKey || "",

    imageUrl: productData.imageUrl || "",
    
    images: productData.images || [],

    specifications:
      productData.specifications || {},

    status:
      productData.status || "ACTIVE",

    createdAt: new Date().toISOString(),

    updatedAt: new Date().toISOString(),

  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: product,
    })
  );

  return product;

}

export async function fetchProducts() {
  try {
    const targetTable = process.env.DYNAMODB_TABLE || process.env.PRODUCTS_TABLE || "Dharineesh_products";
    const result = await docClient.send(new ScanCommand({ TableName: targetTable }));
    return result.Items || [];
  } catch (error) {
    console.warn("DynamoDB fetchProducts scan warning/error:", error.message);
    return [];
  }
}

export async function fetchProductById(productId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { productId: productId },
    })
  );
  return result.Item;
}

export async function modifyProduct(productId, updates) {
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  const allowedFields = [

  "name",

  "description",

  "brand",

  "category",

  "sku",

  "mrp",

  "discountPercentage",

  "sellingPrice",

  "quantity",

  "lowStockThreshold",
  
  "imageKey",

  "imageUrl",
  
  "images",

  "specifications",

  "status"

];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      updateExpressions.push(`#${field} = :${field}`);
      expressionAttributeNames[`#${field}`] = field;
      const numericFields = [

    "mrp",

    "discountPercentage",

    "sellingPrice",

    "quantity",

    "lowStockThreshold"

];

expressionAttributeValues[`:${field}`] =
    numericFields.includes(field)
        ? Number(updates[field])
        : updates[field];
    }
  });

  if (updateExpressions.length === 0) {
    return fetchProductById(productId);
  }

  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  updateExpressions.push('#updatedAt = :updatedAt');

  const result = await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { productId: productId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes;
}

export async function removeProduct(productId) {
  const result = await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { productId: productId },
      ReturnValues: 'ALL_OLD',
    })
  );
  return !!result.Attributes;
}
