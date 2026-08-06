import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createProduct } from '../src/services/productService.js';

describe('Product Service Unit Tests', () => {
  beforeEach(() => {
    process.env.DYNAMODB_TABLE = 'TestProducts';
  });

  test('createProduct should throw error when name is missing', async () => {
    await assert.rejects(
      async () => {
        await createProduct({ brand: 'Nike', category: 'Shoes', sku: 'SKU123', mrp: 100, quantity: 10 });
      },
      (err) => {
        assert.equal(err.message, 'Product name is required.');
        return true;
      }
    );
  });

  test('createProduct should throw error when mrp is invalid', async () => {
    await assert.rejects(
      async () => {
        await createProduct({ name: 'Sneakers', brand: 'Nike', category: 'Shoes', sku: 'SKU123', mrp: 0, quantity: 10 });
      },
      (err) => {
        assert.equal(err.message, 'MRP must be greater than zero.');
        return true;
      }
    );
  });

  test('createProduct should throw error when discount percentage is out of range', async () => {
    await assert.rejects(
      async () => {
        await createProduct({ name: 'Sneakers', brand: 'Nike', category: 'Shoes', sku: 'SKU123', mrp: 100, discountPercentage: 150, quantity: 10 });
      },
      (err) => {
        assert.equal(err.message, 'Discount must be between 0 and 100.');
        return true;
      }
    );
  });

  test('createProduct should throw error when quantity is negative', async () => {
    await assert.rejects(
      async () => {
        await createProduct({ name: 'Sneakers', brand: 'Nike', category: 'Shoes', sku: 'SKU123', mrp: 100, quantity: -5 });
      },
      (err) => {
        assert.equal(err.message, 'Quantity cannot be negative.');
        return true;
      }
    );
  });
});
