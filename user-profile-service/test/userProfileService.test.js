import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.USER_PROFILE_TABLE = 'UserProfile';

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getProfileByCustomerId, getAllProfiles } from '../src/services/userProfileService.js';

describe('User Profile Service Unit Tests', () => {
  test('getProfileByCustomerId should return profile when user exists', async () => {
    const originalSend = DynamoDBDocumentClient.prototype.send;
    DynamoDBDocumentClient.prototype.send = async function () {
      return {
        Item: { customerId: 'cust-001', fullName: 'Dharineesh V', email: 'dharineesh@example.com' }
      };
    };

    try {
      const result = await getProfileByCustomerId('cust-001');
      assert.equal(result.success, true);
      assert.equal(result.data.fullName, 'Dharineesh V');
    } finally {
      DynamoDBDocumentClient.prototype.send = originalSend;
    }
  });

  test('getProfileByCustomerId should throw 404 error when profile does not exist', async () => {
    const originalSend = DynamoDBDocumentClient.prototype.send;
    DynamoDBDocumentClient.prototype.send = async function () {
      return { Item: null };
    };

    try {
      await assert.rejects(
        async () => {
          await getProfileByCustomerId('cust-999');
        },
        (err) => {
          assert.equal(err.message, 'User profile not found.');
          return true;
        }
      );
    } finally {
      DynamoDBDocumentClient.prototype.send = originalSend;
    }
  });

  test('getAllProfiles should return all profile items', async () => {
    const originalSend = DynamoDBDocumentClient.prototype.send;
    DynamoDBDocumentClient.prototype.send = async function () {
      return {
        Items: [
          { customerId: 'cust-001', fullName: 'Dharineesh V' },
          { customerId: 'cust-002', fullName: 'Raveen' }
        ]
      };
    };

    try {
      const result = await getAllProfiles();
      assert.equal(result.success, true);
      assert.equal(result.data.length, 2);
    } finally {
      DynamoDBDocumentClient.prototype.send = originalSend;
    }
  });
});
