import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.COUPONS_TABLE = 'Coupons';
process.env.FESTIVAL_SALES_TABLE = 'FestivalSales';

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getCouponById, getAllCoupons } from '../src/services/couponService.js';
import { getActiveFestivalSale } from '../src/services/festivalSaleService.js';

describe('Marketing Service Unit Tests', () => {
  test('getCouponById should return coupon details when valid ID is provided', async () => {
    const originalSend = DynamoDBDocumentClient.prototype.send;
    DynamoDBDocumentClient.prototype.send = async function () {
      return {
        Item: { couponId: 'coup-1', couponCode: 'WELCOME10', discountValue: 10, discountType: 'PERCENTAGE', active: true }
      };
    };

    try {
      const result = await getCouponById('coup-1');
      assert.equal(result.couponId, 'coup-1');
      assert.equal(result.couponCode, 'WELCOME10');
    } finally {
      DynamoDBDocumentClient.prototype.send = originalSend;
    }
  });

  test('getAllCoupons should return all coupons list', async () => {
    const originalSend = DynamoDBDocumentClient.prototype.send;
    DynamoDBDocumentClient.prototype.send = async function () {
      return {
        Items: [
          { couponId: 'coup-1', couponCode: 'WELCOME10' },
          { couponId: 'coup-2', couponCode: 'SAVE20' }
        ]
      };
    };

    try {
      const result = await getAllCoupons();
      assert.equal(result.length, 2);
    } finally {
      DynamoDBDocumentClient.prototype.send = originalSend;
    }
  });

  test('getActiveFestivalSale should return active festival sale record', async () => {
    const originalSend = DynamoDBDocumentClient.prototype.send;
    DynamoDBDocumentClient.prototype.send = async function () {
      return {
        Items: [
          { saleId: 'sale-1', title: 'Mega Diwali Sale', status: 'ACTIVE' }
        ]
      };
    };

    try {
      const result = await getActiveFestivalSale();
      assert.equal(result.title, 'Mega Diwali Sale');
    } finally {
      DynamoDBDocumentClient.prototype.send = originalSend;
    }
  });
});
