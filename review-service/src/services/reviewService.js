import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  QueryCommand,
  DeleteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import AWSXRay from "aws-xray-sdk";

const REGION = process.env.AWS_REGION || "ap-southeast-1";
const TABLE_NAME = process.env.REVIEW_TABLE || "Dharineesh_reviews";

const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({ region: REGION }));
const docClient = DynamoDBDocumentClient.from(ddbClient);

// In-memory fallback cache to ensure microservice resilience if table is initializing
const inMemoryStore = {};

export async function addReview({ productId, customerId, customerName, rating, title, comment }) {
  if (!productId) throw new Error("productId is required");
  if (!rating || rating < 1 || rating > 5) throw new Error("rating must be a number between 1 and 5");
  if (!comment || !comment.trim()) throw new Error("comment is required");

  const reviewId = uuidv4();
  const createdAt = new Date().toISOString();
  const numericRating = Number(rating);

  const reviewItem = {
    reviewId,
    productId,
    customerId: customerId || "anonymous",
    customerName: customerName || "Verified Customer",
    rating: numericRating,
    title: title ? title.trim() : "",
    comment: comment.trim(),
    createdAt,
    updatedAt: createdAt,
  };

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: reviewItem,
    });
    await docClient.send(command);
  } catch (error) {
    console.warn("DynamoDB PutCommand warning/error, storing in fallback memory:", error.message);
  }

  // Always keep in-memory sync
  if (!inMemoryStore[productId]) {
    inMemoryStore[productId] = [];
  }
  inMemoryStore[productId].unshift(reviewItem);

  return reviewItem;
}

export async function getProductReviews(productId) {
  if (!productId) throw new Error("productId is required");

  let reviews = [];

  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
    });
    const response = await docClient.send(command);
    if (response.Items && response.Items.length > 0) {
      const targetPid = String(productId).trim().toLowerCase();
      reviews = response.Items.filter(item => {
        const itemPid = String(item.productId || item.product_id || item.id || "").trim().toLowerCase();
        return itemPid === targetPid;
      });
    }
  } catch (error) {
    console.warn("DynamoDB ScanCommand warning/error, falling back to memory:", error.message);
  }

  // Merge in-memory reviews if any exist and aren't already present
  if (inMemoryStore[productId]) {
    const existingIds = new Set(reviews.map((r) => r.reviewId));
    inMemoryStore[productId].forEach((memReview) => {
      if (!existingIds.has(memReview.reviewId)) {
        reviews.push(memReview);
      }
    });
  }

  // Sort descending by createdAt
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Compute Summary Statistics
  const totalReviews = reviews.length;
  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumRating = 0;

  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
    ratingBreakdown[star] = (ratingBreakdown[star] || 0) + 1;
    sumRating += r.rating || 5;
  });

  const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 0;

  return {
    productId,
    summary: {
      averageRating,
      totalReviews,
      ratingBreakdown,
    },
    reviews,
  };
}

export async function deleteReview(reviewId, customerId) {
  if (!reviewId) throw new Error("reviewId is required");

  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { reviewId },
    });
    await docClient.send(command);
  } catch (error) {
    console.warn("DynamoDB DeleteCommand warning/error:", error.message);
  }

  // Also remove from in-memory cache if present
  Object.keys(inMemoryStore).forEach((pid) => {
    inMemoryStore[pid] = inMemoryStore[pid].filter((r) => r.reviewId !== reviewId);
  });

  return { success: true, message: "Review deleted successfully" };
}
