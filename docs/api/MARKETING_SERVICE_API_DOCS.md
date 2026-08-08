# Marketing Service API - Technical Documentation

## Service Details
- **Base URL**: `https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/marketing`
- **Database Table**: `Dharineesh_coupons` (AWS DynamoDB)

---

## API Endpoints

### 1. Get Active Festival Sale Banner
**Fetches promotional banners and active discount event configurations for storefront display**

```http
GET /api/v1/marketing/active-sale
```

**Response (200 OK)**:
```json
{
  "success": true,
  "sale": {
    "saleId": "sale-festival-2026",
    "name": "Festival Grand Sale",
    "discountPercentage": 10,
    "bannerText": "🔥 Festival Sale - Flat 10% Extra OFF Everything!",
    "isActive": true
  }
}
```

---

### 2. Apply Coupon Code
**Validates and applies promotional discount code to cart total**

```http
POST /api/v1/marketing/apply-coupon
Content-Type: application/json

{
  "code": "FESTIVAL10",
  "cartAmount": 2000.00
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "discountAmount": 200.00,
  "finalAmount": 1800.00,
  "message": "Coupon FESTIVAL10 applied successfully!"
}
```
