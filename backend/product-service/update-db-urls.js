import dotenv from 'dotenv';
dotenv.config();

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = process.env.DYNAMODB_TABLE;

async function migrateImages() {
  console.log(`Starting migration for table: ${tableName}`);
  
  try {
    const scanResult = await docClient.send(new ScanCommand({
      TableName: tableName
    }));
    
    const products = scanResult.Items || [];
    console.log(`Found ${products.length} products.`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      if (product.imageUrl && product.imageUrl.includes('cloudbasket-product-images')) {
        const newUrl = product.imageUrl.replace('cloudbasket-product-images', 'cloudbasket-products-images');
        
        console.log(`Updating product ID: ${product.productId}...`);
        
        await docClient.send(new UpdateCommand({
          TableName: tableName,
          Key: { productId: product.productId },
          UpdateExpression: 'set imageUrl = :u',
          ExpressionAttributeValues: {
            ':u': newUrl
          }
        }));
        
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Migration complete! Updated ${updatedCount} products to the new bucket URL.`);
    
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrateImages();
