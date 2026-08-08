# Order Service API - Technical Documentation

## Service Details
- **Base URL**: `https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/order`
- **Database Table**: `Dharineesh_orders` (AWS DynamoDB)
- **Event Bus**: AWS SNS (`ORDER_PLACED`, `ORDER_CANCELLED`)

---

## Order Status Lifecycle
```
PENDING ──► CONFIRMED ──► SHIPPED ──► DELIVERED
   │
   ├──► CANCELLED
   ├──► PAYMENT_PENDING
   └──► REFUNDED
```

---

## API Endpoints

### 1. Place New Order
**Converts customer's active cart into a new order, triggering an `ORDER_PLACED` event to SNS**

```http
POST /api/v1/order
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json

{
  "customerId": "cust-001",
  "shippingAddress": {
    "fullName": "Jane Doe",
    "addressLine1": "123 Tech Park Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560001",
    "phone": "9876543210"
  },
  "paymentMethod": "RAZORPAY"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ord-88392019-2026",
    "status": "PENDING",
    "totalAmount": 2854.80,
    "itemCount": 2,
    "createdAt": "2026-08-08T14:20:00.000Z"
  }
}
```

---

### 2. Get Order History For Customer
**Fetch all historical orders for a specific customer**

```http
GET /api/v1/order/cust-001
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "orders": [
    {
      "orderId": "ord-88392019-2026",
      "status": "SHIPPED",
      "totalAmount": 2854.80,
      "items": [ ... ],
      "createdAt": "2026-08-08T14:20:00.000Z"
    }
  ]
}
```

---

### 3. Get Single Order Details
**Get detailed breakdown of items, financial total, delivery tracker status, and PDF metadata**

```http
GET /api/v1/order/cust-001/ord-88392019-2026
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

---

### 4. Cancel Order
**Cancels a PENDING order and triggers `ORDER_CANCELLED` event to SNS for stock restoration**

```http
PATCH /api/v1/order/cust-001/ord-88392019-2026/cancel
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "status": "CANCELLED"
}
```
