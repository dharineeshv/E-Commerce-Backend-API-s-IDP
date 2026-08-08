# User Profile Service API - Technical Documentation

## Service Details
- **Base URL**: `https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/user-profile`
- **Database Table**: `Dharineesh_user_profiles` (AWS DynamoDB)

---

## API Endpoints

### 1. Get User Profile
**Fetch user profile data and saved shipping addresses**

```http
GET /api/v1/user-profile/cust-001
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "customerId": "cust-001",
    "name": "Jane Doe",
    "email": "customer@example.com",
    "phone": "9876543210",
    "addresses": [
      {
        "addressId": "addr-1",
        "fullName": "Jane Doe",
        "addressLine1": "123 Tech Park Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postalCode": "560001",
        "isDefault": true
      }
    ]
  }
}
```

---

### 2. Update User Profile
**Update user details or add/edit delivery addresses**

```http
PUT /api/v1/user-profile/cust-001
Authorization: Bearer <CUSTOMER_ACCESS_TOKEN>
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "9876543210"
}
```
