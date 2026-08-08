# Product Service API - Technical Documentation

## Service Details
- **Base URL**: `https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/products`
- **Database Table**: `Dharineesh_products` (AWS DynamoDB)
- **CDN Domain**: `https://d2vghmouksu39n.cloudfront.net`
- **Storage**: AWS S3 Bucket (`cloudbasket-product-images`)

---

## API Endpoints

### 1. List All Products
**Fetch product catalog with optional search, category, and limit parameters**

```http
GET /api/v1/products?category=Electronics&search=Headphones
```

**Response (200 OK)**:
```json
{
  "success": true,
  "count": 1,
  "products": [
    {
      "productId": "prod-101",
      "name": "Sony WH-1000XM5 Wireless Headphones",
      "category": "Electronics",
      "brand": "Sony",
      "mrp": 29990.00,
      "discountPercentage": 15,
      "sellingPrice": 25491.50,
      "quantity": 25,
      "imageUrl": "https://d2vghmouksu39n.cloudfront.net/products/sony-xm5.jpg",
      "rating": 4.8,
      "reviews": 124,
      "isLowStock": false
    }
  ]
}
```

---

### 2. Get Product By ID
**Retrieve full specifications and metadata for a single product**

```http
GET /api/v1/products/prod-101
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "productId": "prod-101",
    "name": "Sony WH-1000XM5 Wireless Headphones",
    "description": "Industry-leading noise canceling headphones with dual processors.",
    "category": "Electronics",
    "brand": "Sony",
    "sku": "SONY-XM5-BLK",
    "mrp": 29990.00,
    "discountPercentage": 15,
    "sellingPrice": 25491.50,
    "quantity": 25,
    "lowStockThreshold": 5,
    "imageUrl": "https://d2vghmouksu39n.cloudfront.net/products/sony-xm5.jpg"
  }
}
```

---

### 3. Create Product (Admin Only)
**Create a new product record in DynamoDB with automatic CloudFront URL conversion**

```http
POST /api/v1/products
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json

{
  "name": "Wireless Mechanical Keyboard",
  "category": "Accessories",
  "brand": "Logitech",
  "sku": "LOGI-MX-MECH",
  "mrp": 14995.00,
  "discountPercentage": 10,
  "quantity": 50,
  "lowStockThreshold": 10,
  "imageUrl": "https://d2vghmouksu39n.cloudfront.net/products/mx-mech.jpg"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "productId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "name": "Wireless Mechanical Keyboard",
    "sellingPrice": 13495.50
  }
}
```

---

### 4. Update Product (Admin Only)
**Update existing product attributes**

```http
PUT /api/v1/products/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json

{
  "quantity": 45,
  "discountPercentage": 12
}
```

---

### 5. Delete Product (Admin Only)
**Remove a product record from DynamoDB**

```http
DELETE /api/v1/products/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```
