import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.PAYMENT_TABLE = 'Payments';

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getPaymentByOrderId, getAllPayments, updatePaymentStatus } from '../src/services/paymentService.js';

describe('Payment Service Unit Tests', () => {
  test('getPaymentByOrderId should return payment record when order has payment', async () => {
    const originalSend = DynamoDBDocumentClient.prototype.send;
    DynamoDBDocumentClient.prototype.send = async function () {
      return {
        Items: [
          { paymentId: 'pay-1', orderId: 'ord-100', status: 'SUCCESS', amount: 1500 }
        ]
      };
    };

    try {
      const result = await getPaymentByOrderId('ord-100');
      assert.equal(result.paymentId, 'pay-1');
      assert.equal(result.status, 'SUCCESS');
    } finally {
      DynamoDBDocumentClient.prototype.send = originalSend;
    }
  });

  test('getAllPayments should return all payment items list', async () => {
    const originalSend = DynamoDBDocumentClient.prototype.send;
    DynamoDBDocumentClient.prototype.send = async function () {
      return {
        Items: [
          { paymentId: 'pay-1', amount: 1500 },
          { paymentId: 'pay-2', amount: 2500 }
        ]
      };
    };

    try {
      const result = await getAllPayments();
      assert.equal(result.length, 2);
    } finally {
      DynamoDBDocumentClient.prototype.send = originalSend;
    }
  });

  test('updatePaymentStatus should reject invalid payment status', async () => {
    await assert.rejects(
      async () => {
        await updatePaymentStatus('pay-1', 'INVALID_STATUS');
      },
      (err) => {
        assert.match(err.message, /Invalid status/);
        return true;
      }
    );
  });
});
