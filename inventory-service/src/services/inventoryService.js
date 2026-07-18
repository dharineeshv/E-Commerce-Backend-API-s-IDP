import "../config/env.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { ddbDocClient } from "../config/dynamodb.js";
import {
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const INVENTORY_TABLE = process.env.INVENTORY_TABLE;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;
const PRODUCT_SERVICE_BASE_URL = PRODUCT_SERVICE_URL.replace(
  /\/api\/v1\/products\/?$/i,
  ""
);

async function verifyProductExists(productId) {
  try {
    // Fixed: was /products/${productId}, correct path is /api/products/${productId}
    const response = await axios.get(
  `${PRODUCT_SERVICE_BASE_URL}/api/v1/products/${productId}`
);
    return response.status === 200 && response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    throw error;
  }
}

async function createInventoryItem({ productId, quantity, location }) {
  if (!productId || quantity === undefined) {
    const error = new Error('productId and quantity are required');
    error.statusCode = 400;
    throw error;
  }

  if (quantity < 0) {
    const error = new Error('Quantity must be zero or greater');
    error.statusCode = 400;
    throw error;
  }

  const productExists = await verifyProductExists(productId);
  if (!productExists) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const inventoryItem = {
    inventoryId: uuidv4(),
    productId,
    quantity,
    location: location || 'default',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await ddbDocClient.send(new PutCommand({
    TableName: INVENTORY_TABLE,
    Item: inventoryItem,
  }));

  return inventoryItem;
}

async function getAllInventoryItems() {
  const result = await ddbDocClient.send(new ScanCommand({ TableName: INVENTORY_TABLE }));
  return result.Items || [];
}

async function getInventoryItemByProductId(productId) {
  const result = await ddbDocClient.send(new ScanCommand({
    TableName: INVENTORY_TABLE,
    FilterExpression: '#productId = :productId',
    ExpressionAttributeNames: { '#productId': 'productId' },
    ExpressionAttributeValues: { ':productId': productId }
  }));
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

async function updateInventoryItem(productId, updates) {
  const existingItem = await getInventoryItemByProductId(productId);
  if (!existingItem) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }

  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  if (updates.quantity !== undefined) {
    if (updates.quantity < 0) {
      const error = new Error('Quantity must be zero or greater');
      error.statusCode = 400;
      throw error;
    }
    updateExpression.push('#quantity = :quantity');
    expressionAttributeNames['#quantity'] = 'quantity';
    expressionAttributeValues[':quantity'] = updates.quantity;
  }

  if (updates.location) {
    updateExpression.push('#location = :location');
    expressionAttributeNames['#location'] = 'location';
    expressionAttributeValues[':location'] = updates.location;
  }

  if (updateExpression.length === 0) {
    return existingItem;
  }

  updateExpression.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  // Fixed: was ddbDocClient.update(params) — must use ddbDocClient.send(new UpdateCommand(params))
  const result = await ddbDocClient.send(new UpdateCommand({
    TableName: INVENTORY_TABLE,
    Key: { inventoryId: existingItem.inventoryId },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  }));

  return result.Attributes;
}

async function deleteInventoryItem(productId) {
  const existingItem = await getInventoryItemByProductId(productId);
  if (!existingItem) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }

  // Fixed: was ddbDocClient.delete(params) — must use ddbDocClient.send(new DeleteCommand(params))
  await ddbDocClient.send(new DeleteCommand({
    TableName: INVENTORY_TABLE,
    Key: { inventoryId: existingItem.inventoryId },
  }));

  return existingItem;
}

async function checkInventory(productId) {
  const item = await getInventoryItemByProductId(productId);
  if (!item) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }
  return { productId, quantity: item.quantity, location: item.location };
}

async function reduceInventory(productId, amount) {
  if (!amount || amount <= 0) {
    const error = new Error('Amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const item = await getInventoryItemByProductId(productId);
  if (!item) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }

  if (item.quantity < amount) {
    const error = new Error(`Insufficient inventory. Available: ${item.quantity}`);
    error.statusCode = 400;
    throw error;
  }

  // Fixed: was ddbDocClient.update(params) — must use ddbDocClient.send(new UpdateCommand(params))
  const result = await ddbDocClient.send(new UpdateCommand({
    TableName: INVENTORY_TABLE,
    Key: { inventoryId: item.inventoryId },
    UpdateExpression: 'SET #quantity = #quantity - :amount, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#quantity': 'quantity',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':amount': amount,
      ':updatedAt': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  }));

  return result.Attributes;
}

async function restoreInventory(productId, amount) {
  if (!amount || amount <= 0) {
    const error = new Error('Amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const item = await getInventoryItemByProductId(productId);
  if (!item) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }

  // Fixed: was ddbDocClient.update(params) — must use ddbDocClient.send(new UpdateCommand(params))
  const result = await ddbDocClient.send(new UpdateCommand({
    TableName: INVENTORY_TABLE,
    Key: { inventoryId: item.inventoryId },
    UpdateExpression: 'SET #quantity = #quantity + :amount, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#quantity': 'quantity',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':amount': amount,
      ':updatedAt': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  }));

  return result.Attributes;
}

async function getLowStockItems(threshold = 10) {
  // Fixed: was ddbDocClient.scan(params) — must use ddbDocClient.send(new ScanCommand(params))
  const result = await ddbDocClient.send(new ScanCommand({
    TableName: INVENTORY_TABLE,
    FilterExpression: '#quantity <= :threshold',
    ExpressionAttributeNames: { '#quantity': 'quantity' },
    ExpressionAttributeValues: { ':threshold': threshold },
  }));

  return result.Items || [];
}

export {
  createInventoryItem,
  getAllInventoryItems,
  getInventoryItemByProductId,
  updateInventoryItem,
  deleteInventoryItem,
  checkInventory,
  reduceInventory,
  restoreInventory,
  getLowStockItems,
};
