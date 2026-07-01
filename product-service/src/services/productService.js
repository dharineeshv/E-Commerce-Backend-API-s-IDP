import dotenv from 'dotenv';
dotenv.config();

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = process.env.DYNAMODB_TABLE;

export async function createProduct(productData) {
  const product = {
    productId: uuidv4(),
    name: productData.name,
    description: productData.description || '',
    price: Number(productData.price),
    quantity: Number(productData.quantity),
    category: productData.category || 'General',
    imageUrl: productData.imageUrl || '',
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
  const result = await docClient.send(new ScanCommand({ TableName: tableName }));
  return result.Items || [];
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

  const allowedFields = ['name', 'description', 'price', 'quantity', 'category', 'imageUrl'];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      updateExpressions.push(`#${field} = :${field}`);
      expressionAttributeNames[`#${field}`] = field;
      expressionAttributeValues[`:${field}`] = field === 'price' || field === 'quantity' ? Number(updates[field]) : updates[field];
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
