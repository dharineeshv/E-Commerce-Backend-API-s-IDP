# Inventory Service API - Technical Documentation

## Service Details
- **Base URL**: `https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/inventory`
- **Database Table**: `Dharineesh_inventory` (AWS DynamoDB)
- **Event Consumer**: AWS SQS Queue (`InventoryQueue` listening for `ORDER_PLACED` & `ORDER_CANCELLED`)

---

## API Endpoints

### 1. Get Stock for Product
**Check stock quantity and low-stock threshold for a product**

```http
GET /api/v1/inventory/prod-101
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "productId": "prod-101",
    "quantity": 25,
    "lowStockThreshold": 5,
    "isLowStock": false,
    "status": "IN_STOCK"
  }
}
```

---

### 2. Manual Reduce Stock (Internal / Admin)
**Deducts item stock manually or via system triggers**

```http
PUT /api/v1/inventory/reduce/prod-101
Content-Type: application/json

{
  "quantity": 2
}
```

---

### 3. Manual Restore Stock (Internal / Admin)
**Restores item stock manually or on order cancellation**

```http
PUT /api/v1/inventory/restore/prod-101
Content-Type: application/json

{
  "quantity": 2
}
```
