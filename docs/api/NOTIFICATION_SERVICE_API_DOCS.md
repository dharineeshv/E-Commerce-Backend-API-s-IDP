# Notification Service API - Technical Documentation

## Service Details
- **Trigger**: AWS SQS Queue (`NotificationQueue`) subscribed to SNS Event Bus
- **Transport**: Nodemailer + Gmail SMTP Gateway
- **Email Copy**: Sent to Customer + Copy to Store Owner (`STORE_OWNER_EMAIL`)

---

## Event Handling Matrix

| Event Type | Email Subject | Recipient |
|---|---|---|
| `ORDER_PLACED` | Order Confirmation — `#<orderId>` | Customer & Store Owner |
| `ORDER_CANCELLED` | Order Cancellation Notice — `#<orderId>` | Customer & Store Owner |
| `PAYMENT_SUCCESS` | Payment Confirmation — `#<paymentId>` | Customer & Store Owner |
| `PAYMENT_PENDING` | COD Payment Notice — `#<orderId>` | Customer & Store Owner |
| `PAYMENT_REFUNDED` | Refund Confirmation — `#<paymentId>` | Customer & Store Owner |
