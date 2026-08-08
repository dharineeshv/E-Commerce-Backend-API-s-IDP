# Payment Service API - Technical Documentation

## Service Details
- **Base URL**: `https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/payments`
- **Database Table**: `Dharineesh_payments` (AWS DynamoDB)
- **Gateway Integration**: Razorpay Gateway (Cards, NetBanking, UPI) & Cash On Delivery (COD)
- **Event Bus**: AWS SNS (`PAYMENT_SUCCESS`, `PAYMENT_PENDING`, `PAYMENT_REFUNDED`)

---

## API Endpoints

### 1. Create Razorpay Payment Order
**Initiates a Razorpay payment order and generates an official Razorpay `order_id`**

```http
POST /api/v1/payments/create-razorpay-order
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json

{
  "orderId": "ord-88392019-2026",
  "amount": 2854.80,
  "currency": "INR"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "razorpayOrderId": "order_N1X8a90ZqLKJ21",
  "amount": 285480,
  "currency": "INR"
}
```

---

### 2. Verify Razorpay Payment Signature
**Cryptographically verifies HMAC SHA-256 signature returned by Razorpay checkout modal**

```http
POST /api/v1/payments/verify-razorpay
Content-Type: application/json

{
  "razorpay_order_id": "order_N1X8a90ZqLKJ21",
  "razorpay_payment_id": "pay_P89123019823",
  "razorpay_signature": "a1b2c3d4e5f67890...",
  "orderId": "ord-88392019-2026"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "paymentId": "pay_P89123019823",
  "status": "SUCCESS"
}
```

---

### 3. Create Cash On Delivery (COD) Payment
**Registers a COD payment record and broadcasts `PAYMENT_PENDING` event to SNS**

```http
POST /api/v1/payments/cod
Content-Type: application/json

{
  "orderId": "ord-88392019-2026",
  "amount": 2854.80
}
```

---

### 4. Issue Payment Refund (Admin / Automated)
**Processes a refund for a cancelled order and broadcasts `PAYMENT_REFUNDED` to SNS**

```http
POST /api/v1/payments/refund
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json

{
  "orderId": "ord-88392019-2026",
  "reason": "Customer cancelled order"
}
```
