import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import dynamodb from '../src/config/dynamodb.js';
import {
  getOrderById,
  getAllOrders,
  getOrdersByCustomer,
  updateOrderStatus
} from '../src/services/orderService.js';

describe('Order Service Unit Tests', () => {
  let originalSend;

  beforeEach(() => {
    process.env.ORDER_TABLE = 'TestOrders';
  });

  test('getOrderById should return order when exists and belongs to customer', async () => {
    originalSend = dynamodb.send;
    dynamodb.send = async (command) => {
      return {
        Item: {
          orderId: 'ord-100',
          customerId: 'cust-001',
          orderTotal: 1500,
          status: 'DELIVERED'
        }
      };
    };

    try {
      const result = await getOrderById('cust-001', 'ord-100');
      assert.equal(result.success, true);
      assert.equal(result.data.orderId, 'ord-100');
      assert.equal(result.data.orderTotal, 1500);
    } finally {
      dynamodb.send = originalSend;
    }
  });

  test('getOrderById should throw error when order not found', async () => {
    originalSend = dynamodb.send;
    dynamodb.send = async (command) => {
      return { Item: null };
    };

    try {
      await assert.rejects(
        async () => {
          await getOrderById('cust-001', 'ord-999');
        },
        (err) => {
          assert.equal(err.message, 'Order not found');
          return true;
        }
      );
    } finally {
      dynamodb.send = originalSend;
    }
  });

  test('getAllOrders should return array of orders', async () => {
    originalSend = dynamodb.send;
    dynamodb.send = async (command) => {
      return {
        Items: [
          { orderId: 'ord-100', status: 'PENDING' },
          { orderId: 'ord-101', status: 'SHIPPED' }
        ]
      };
    };

    try {
      const result = await getAllOrders();
      assert.equal(result.success, true);
      assert.equal(result.data.length, 2);
    } finally {
      dynamodb.send = originalSend;
    }
  });

  test('updateOrderStatus should reject invalid status string', async () => {
    try {
      await assert.rejects(
        async () => {
          await updateOrderStatus('ord-100', 'INVALID_STATUS');
        },
        (err) => {
          assert.match(err.message, /Invalid status/);
          return true;
        }
      );
    } catch (e) {
      assert.fail(e);
    }
  });

  test('updateOrderStatus should update valid status successfully', async () => {
    originalSend = dynamodb.send;
    dynamodb.send = async (command) => {
      if (command.constructor.name === 'GetCommand') {
        return { Item: { orderId: 'ord-100', status: 'PENDING' } };
      }
      return { Attributes: { orderId: 'ord-100', status: 'SHIPPED' } };
    };

    try {
      const result = await updateOrderStatus('ord-100', 'SHIPPED');
      assert.equal(result.success, true);
      assert.equal(result.data.status, 'SHIPPED');
    } finally {
      dynamodb.send = originalSend;
    }
  });
});
