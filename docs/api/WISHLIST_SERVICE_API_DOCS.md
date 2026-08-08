# Wishlist Service API - Technical Documentation

## Service Details
- **Base URL**: `https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/wishlist`
- **Database Table**: `Dharineesh_wishlists` (AWS DynamoDB)

---

## API Endpoints

### 1. Get Customer Wishlist
**Fetch all saved wishlist items for a customer**

```http
GET /api/v1/wishlist/cust-001
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "items": [
    {
      "productId": "prod-101",
      "addedAt": "2026-08-05T12:00:00.000Z",
      "productDetails": {
        "name": "Sony WH-1000XM5 Wireless Headphones",
        "sellingPrice": 25491.50,
        "imageUrl": "https://d2vghmouksu39n.cloudfront.net/products/sony-xm5.jpg"
      }
    }
  ]
}
```

---

### 2. Toggle / Add Item to Wishlist
**Add a product to customer's wishlist**

```http
POST /api/v1/wishlist
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json

{
  "customerId": "cust-001",
  "productId": "prod-101"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product added to wishlist successfully"
}
```

---

### 3. Remove Item from Wishlist
**Remove a product from customer's wishlist**

```http
DELETE /api/v1/wishlist/cust-001/prod-101
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product removed from wishlist"
}
```
