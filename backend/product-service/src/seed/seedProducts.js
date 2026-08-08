import dotenv from 'dotenv';
dotenv.config();

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const products = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Over-ear noise-cancelling headphones with up to 30 hours battery life.',
    price: 89.99,
    quantity: 120,
    category: 'Electronics',
    imageUrl: 'https://example.com/images/headphones.jpg',
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Track heart rate, sleep, and workouts with smartphone notifications.',
    price: 59.99,
    quantity: 150,
    category: 'Wearables',
    imageUrl: 'https://example.com/images/fitness-watch.jpg',
  },
  {
    name: 'Portable Power Bank',
    description: '20000mAh power bank with fast charging for multiple devices.',
    price: 29.99,
    quantity: 200,
    category: 'Accessories',
    imageUrl: 'https://example.com/images/power-bank.jpg',
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with adjustable DPI and silent clicks.',
    price: 24.99,
    quantity: 90,
    category: 'Computer Accessories',
    imageUrl: 'https://example.com/images/wireless-mouse.jpg',
  },
  {
    name: 'Mechanical Keyboard',
    description: 'Compact mechanical keyboard with RGB lighting and tactile switches.',
    price: 79.99,
    quantity: 70,
    category: 'Computer Accessories',
    imageUrl: 'https://example.com/images/mechanical-keyboard.jpg',
  },
  {
    name: 'Smart LED Desk Lamp',
    description: 'Dimmable desk lamp with touch controls and color temperature modes.',
    price: 39.99,
    quantity: 130,
    category: 'Home',
    imageUrl: 'https://example.com/images/desk-lamp.jpg',
  },
  {
    name: 'Noise Cancelling Earbuds',
    description: 'In-ear wireless earbuds with active noise cancellation and long playtime.',
    price: 49.99,
    quantity: 140,
    category: 'Electronics',
    imageUrl: 'https://example.com/images/earbuds.jpg',
  },
  {
    name: 'Yoga Mat',
    description: 'Non-slip yoga mat with cushioned surface for all workout levels.',
    price: 19.99,
    quantity: 180,
    category: 'Fitness',
    imageUrl: 'https://example.com/images/yoga-mat.jpg',
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Insulated water bottle keeps drinks cold for 24 hours.',
    price: 22.99,
    quantity: 160,
    category: 'Outdoor',
    imageUrl: 'https://example.com/images/water-bottle.jpg',
  },
  {
    name: 'Laptop Stand',
    description: 'Adjustable laptop stand with cooling vents and portable design.',
    price: 34.99,
    quantity: 100,
    category: 'Office',
    imageUrl: 'https://example.com/images/laptop-stand.jpg',
  },
];

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = process.env.DYNAMODB_TABLE;

async function seed() {
  try {
    for (const product of products) {
      const item = {
        productId: uuidv4(),
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );
      console.log(`Seeded product: ${item.name}`);
    }
    console.log('Product seed complete.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
