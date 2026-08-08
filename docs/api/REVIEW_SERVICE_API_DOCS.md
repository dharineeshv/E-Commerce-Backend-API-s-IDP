# Review Service API - Technical Documentation

## Service Details
- **Base URL**: `https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/reviews`
- **Database Table**: `Dharineesh_reviews` (AWS DynamoDB)
- **Features**: Customer ratings, star aggregations, user-scoped review deletion, review summaries

---

## API Endpoints

### 1. Get Reviews for Product
**Fetch all customer reviews and average rating summary for a product**

```http
GET /api/v1/reviews/product/prod-101
```

**Response (200 OK)**:
```json
{
  "success": true,
  "summary": {
    "averageRating": 4.8,
    "totalReviews": 124,
    "ratingBreakdown": {
      "5": 98,
      "4": 20,
      "3": 4,
      "2": 2,
      "1": 0
    }
  },
  "reviews": [
    {
      "reviewId": "rev-10923",
      "productId": "prod-101",
      "customerName": "Jane Doe",
      "userSub": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      "rating": 5,
      "comment": "Outstanding sound quality and active noise cancellation!",
      "createdAt": "2026-08-01T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Submit New Review
**Allows logged-in customers to submit a rating (1-5) and text review**

```http
POST /api/v1/reviews
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json

{
  "productId": "prod-101",
  "rating": 5,
  "comment": "Best noise-canceling headphones in class."
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "reviewId": "rev-10924",
    "productId": "prod-101",
    "rating": 5,
    "comment": "Best noise-canceling headphones in class."
  }
}
```

---

### 3. Delete Review (User-Scoped / Owner Only)
**Allows review authors to delete their own review. Restricted on frontend to review owners only.**

```http
DELETE /api/v1/reviews/rev-10924
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```
