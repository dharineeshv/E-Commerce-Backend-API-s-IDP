import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Set fallback env before importing module
process.env.PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003/api/v1/products';
process.env.INVENTORY_TABLE = process.env.INVENTORY_TABLE || 'TestInventory';

import { ddbDocClient } from '../src/config/dynamodb.js';
import {
  getAllInventoryItems,
  getInventoryItemByProductId,
  checkInventory,
  reduceInventory,
  restoreInventory,
  getLowStockItems
} from '../src/services/inventoryService.js';

describe('Inventory Service Unit Tests', () => {
  let originalSend;

  beforeEach(() => {
    process.env.INVENTORY_TABLE = 'TestInventory';
    process.env.PRODUCT_SERVICE_URL = 'http://localhost:3003/api/v1/products';
  });

  test('getAllInventoryItems should return list of inventory items', async () => {
    originalSend = ddbDocClient.send;
    ddbDocClient.send = async (command) => {
      return {
        Items: [
          { inventoryId: 'inv-1', productId: 'prod-101', quantity: 50, location: 'Warehouse A' },
          { inventoryId: 'inv-2', productId: 'prod-102', quantity: 5, location: 'Warehouse B' }
        ]
      };
    };

    try {
      const items = await getAllInventoryItems();
      assert.equal(items.length, 2);
      assert.equal(items[0].productId, 'prod-101');
    } finally {
      ddbDocClient.send = originalSend;
    }
  });

  test('checkInventory should return item status when product exists', async () => {
    originalSend = ddbDocClient.send;
    ddbDocClient.send = async (command) => {
      return {
        Items: [{ inventoryId: 'inv-1', productId: 'prod-101', quantity: 25, location: 'Warehouse A' }]
      };
    };

    try {
      const info = await checkInventory('prod-101');
      assert.equal(info.productId, 'prod-101');
      assert.equal(info.quantity, 25);
    } finally {
      ddbDocClient.send = originalSend;
    }
  });

  test('checkInventory should throw 404 when item does not exist', async () => {
    originalSend = ddbDocClient.send;
    ddbDocClient.send = async (command) => {
      return { Items: [] };
    };

    try {
      await assert.rejects(
        async () => {
          await checkInventory('non-existent');
        },
        (err) => {
          assert.equal(err.statusCode, 404);
          assert.equal(err.message, 'Inventory item not found');
          return true;
        }
      );
    } finally {
      ddbDocClient.send = originalSend;
    }
  });

  test('reduceInventory should reject insufficient stock request', async () => {
    originalSend = ddbDocClient.send;
    ddbDocClient.send = async (command) => {
      return {
        Items: [{ inventoryId: 'inv-1', productId: 'prod-101', quantity: 5, location: 'Warehouse A' }]
      };
    };

    try {
      await assert.rejects(
        async () => {
          await reduceInventory('prod-101', 10);
        },
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /Insufficient inventory/);
          return true;
        }
      );
    } finally {
      ddbDocClient.send = originalSend;
    }
  });

  test('getLowStockItems should filter items below threshold', async () => {
    originalSend = ddbDocClient.send;
    ddbDocClient.send = async (command) => {
      return {
        Items: [
          { inventoryId: 'inv-2', productId: 'prod-102', quantity: 5 }
        ]
      };
    };

    try {
      const items = await getLowStockItems(10);
      assert.equal(items.length, 1);
      assert.equal(items[0].quantity, 5);
    } finally {
      ddbDocClient.send = originalSend;
    }
  });
});
