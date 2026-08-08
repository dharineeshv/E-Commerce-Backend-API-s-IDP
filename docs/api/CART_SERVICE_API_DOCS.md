# Cart Service API - Complete Documentation

## Service Details
- **Base URL**: `http://localhost:5001`
- **API Version**: 1.0
- **Database**: AWS DynamoDB
- **Integration**: Validates products with Product Service (http://localhost:5000)

---

## API Endpoints

### 1. Health Check
**Check if service is running**

```http
GET http://localhost:5001/
```

**Response (200 OK)**:
```json
{
  "message": "Cart service is running"
}
```

---

### 2. Add Product to Cart
**Add a product to customer's cart with product validation**

```http
POST http://localhost:5001/api/cart/{customerId}
Content-Type: application/json

{
  "productId": "7e5e7385-0866-4574-8d6f-bc804a72d50f",
  "quantity": 2
}
```

**URL Parameters**:
- `customerId` (string): Unique customer identifier (e.g., "cust-001")

**Request Body**:
- `productId` (string, required): Product UUID from Product Service
- `quantity` (number, required): Quantity to add (must be > 0)

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "data": {
    "customerId": "cust-001",
    "cartItemId": "a7354a61-ae99-4af0-b150-20f5eba129a5",
    "productId": "7e5e7385-0866-4574-8d6f-bc804a72d50f",
    "productName": "Wireless Mouse",
    "price": 29.99,
    "quantity": 2,
    "totalPrice": 59.98,
    "addedAt": "2026-06-24T09:14:01.862Z"
  }
}
```

**Error Cases**:
- **400**: Product ID or quantity not provided
- **404**: Product not found in Product Service or out of stock
- **500**: DynamoDB error

---

### 3. View Cart
**Get all items in customer's cart with totals**

```http
GET http://localhost:5001/api/cart/{customerId}
```

**URL Parameters**:
- `customerId` (string): Customer identifier

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "customerId": "cust-001",
    "items": [
      {
        "customerId": "cust-001",
        "cartItemId": "a7354a61-ae99-4af0-b150-20f5eba129a5",
        "productId": "7e5e7385-0866-4574-8d6f-bc804a72d50f",
        "productName": "Wireless Mouse",
        "price": 29.99,
        "quantity": 2,
        "totalPrice": 59.98,
        "addedAt": "2026-06-24T09:14:01.862Z"
      },
      {
        "customerId": "cust-001",
        "cartItemId": "b8465b72-bf00-5185-9c261-31f6fcb23bd6",
        "productId": "8f6f8496-1977-5685-9d372-42g7gdc34ce7",
        "productName": "USB-C Cable",
        "price": 12.99,
        "quantity": 3,
        "totalPrice": 38.97,
        "addedAt": "2026-06-24T10:25:15.512Z"
      }
    ],
    "itemCount": 2,
    "cartTotal": 98.95
  }
}
```

---

### 4. Update Cart Item Quantity
**Update quantity of a specific cart item (validates against product stock)**

```http
PUT http://localhost:5001/api/cart/{customerId}/{cartItemId}
Content-Type: application/json

{
  "quantity": 5
}
```

**URL Parameters**:
- `customerId` (string): Customer identifier
- `cartItemId` (string): Cart item UUID (returned when adding to cart)

**Request Body**:
- `quantity` (number, required): New quantity (must be > 0)

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product quantity updated successfully",
  "data": {
    "customerId": "cust-001",
    "cartItemId": "a7354a61-ae99-4af0-b150-20f5eba129a5",
    "productId": "7e5e7385-0866-4574-8d6f-bc804a72d50f",
    "productName": "Wireless Mouse",
    "price": 29.99,
    "quantity": 5,
    "totalPrice": 149.95,
    "addedAt": "2026-06-24T09:14:01.862Z"
  }
}
```

**Error Cases**:
- **400**: Invalid quantity (must be > 0)
- **404**: Cart item not found or product not found
- **400**: Requested quantity exceeds available product stock
- **500**: DynamoDB or Product Service error

---

### 5. Delete Cart Item
**Remove a specific item from cart**

```http
DELETE http://localhost:5001/api/cart/{customerId}/{cartItemId}
```

**URL Parameters**:
- `customerId` (string): Customer identifier
- `cartItemId` (string): Cart item UUID

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product removed from cart successfully"
}
```

**Error Cases**:
- **400**: Invalid customer ID or cart item ID
- **404**: Cart item not found
- **500**: DynamoDB error

---

### 6. Clear Cart
**Remove all items from customer's cart**

```http
DELETE http://localhost:5001/api/cart/{customerId}/cart/clear
```

**URL Parameters**:
- `customerId` (string): Customer identifier

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "itemsRemoved": 2
  }
}
```

---

## Sample Test Workflow

### Step 1: Add First Product
```bash
curl -X POST http://localhost:5001/api/cart/cust-001 \
  -H "Content-Type: application/json" \
  -d '{"productId":"7e5e7385-0866-4574-8d6f-bc804a72d50f","quantity":2}'
```

### Step 2: Add Second Product
```bash
curl -X POST http://localhost:5001/api/cart/cust-001 \
  -H "Content-Type: application/json" \
  -d '{"productId":"8f6f8496-1977-5685-9d372-42g7gdc34ce7","quantity":1}'
```

### Step 3: View Cart
```bash
curl http://localhost:5001/api/cart/cust-001
```

### Step 4: Update Quantity
```bash
curl -X PUT http://localhost:5001/api/cart/cust-001/a7354a61-ae99-4af0-b150-20f5eba129a5 \
  -H "Content-Type: application/json" \
  -d '{"quantity":5}'
```

### Step 5: Delete Item
```bash
curl -X DELETE http://localhost:5001/api/cart/cust-001/a7354a61-ae99-4af0-b150-20f5eba129a5
```

### Step 6: Clear Cart
```bash
curl -X DELETE http://localhost:5001/api/cart/cust-001/cart/clear
```

---

## Database Schema

**Table**: `Cart` (DynamoDB)

**Partition Key**: `customerId`

**Attributes**:
| Attribute | Type | Description |
|-----------|------|-------------|
| customerId | String | Customer identifier (partition key) |
| cartItemId | String | Unique cart item UUID |
| productId | String | Product UUID (from Product Service) |
| productName | String | Product name (fetched from Product Service) |
| price | Number | Product price at time of adding |
| quantity | Number | Quantity of product in cart |
| totalPrice | Number | price × quantity |
| addedAt | String | ISO timestamp when added |

---

## Key Features

✅ **Product Validation**: Checks product exists in Product Service before adding
✅ **Stock Validation**: Verifies available quantity before adding or updating
✅ **Cart Totals**: Automatically calculates item count and cart total
✅ **Error Handling**: Comprehensive error messages with appropriate HTTP status codes
✅ **Cross-Service Integration**: Communicates with Product Service for product data
✅ **DynamoDB Integration**: Persists cart data in AWS DynamoDB

---

## Dependencies

- Express.js 5.2.1
- AWS SDK v3 (@aws-sdk/lib-dynamodb)
- axios 1.18.1
- uuid 14.0.1
- dotenv 16.4.7

---

## Environment Configuration

Create `.env` file with:
```
PORT=5001
AWS_REGION=ap-southeast-2
DYNAMODB_TABLE=Cart
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
PRODUCT_SERVICE_URL=http://localhost:5000
```

---

## Import into Postman

1. Open Postman
2. Click "Import" (top left)
3. Select "Cart-Service-Postman.postman_collection.json"
4. All endpoints and example requests will be imported
5. Update variables as needed for your environment
