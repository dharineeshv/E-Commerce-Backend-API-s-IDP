import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import dynamodb from '../src/config/dynamodb.js';
import { getCartProducts, clearCart } from '../src/services/cartService.js';

describe('Cart Service Unit Tests', () => {
  let originalSend;

  beforeEach(() => {
    process.env.CART_TABLE = 'TestCarts';
  });

  test('getCartProducts should return empty cart items when cart item does not exist', async () => {
    originalSend = dynamodb.send;
    dynamodb.send = async () => {
      return { Items: [] };
    };

    try {
      const result = await getCartProducts('cust-001');
      assert.equal(result.success, true);
      assert.deepEqual(result.data, []);
    } finally {
      dynamodb.send = originalSend;
    }
  });

  test('getCartProducts should return cart items when customer cart exists', async () => {
    originalSend = dynamodb.send;
    dynamodb.send = async () => {
      return {
        Items: [
          { customerId: 'cust-001', cartItemId: 'item-1', productId: 'p1', quantity: 2, price: 500 }
        ]
      };
    };

    try {
      const result = await getCartProducts('cust-001');
      assert.equal(result.success, true);
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].productId, 'p1');
    } finally {
      dynamodb.send = originalSend;
    }
  });

  test('clearCart should execute delete commands and return success', async () => {
    originalSend = dynamodb.send;
    let callCount = 0;
    dynamodb.send = async (cmd) => {
      callCount++;
      if (callCount === 1) {
        return {
          Items: [{ customerId: 'cust-001', cartItemId: 'item-1' }]
        };
      }
      return {};
    };

    try {
      const result = await clearCart('cust-001');
      assert.equal(result.success, true);
      assert.equal(callCount, 2);
    } finally {
      dynamodb.send = originalSend;
    }
  });
});
