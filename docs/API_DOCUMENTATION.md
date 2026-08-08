# CloudBasket Platform - Complete API Documentation Index

Welcome to the CloudBasket Microservices API Documentation. All endpoints are hosted on Amazon API Gateway and mapped under the versioned route prefix `/api/v1/`.

---

## 📚 Microservice Technical Documentation Index

| Microservice | Base Route | Documentation File | Primary Purpose |
|---|---|---|---|
| **Authentication Service** | `/api/v1/auth` | [`docs/api/AUTHENTICATION_SERVICE_API_DOCS.md`](file:///docs/api/AUTHENTICATION_SERVICE_API_DOCS.md) | Cognito User registration, login, verification & session JWT tokens |
| **Cart Service** | `/api/v1/cart` | [`docs/api/CART_SERVICE_API_DOCS.md`](file:///docs/api/CART_SERVICE_API_DOCS.md) | Cart item management, totals calculation & stock checks |
| **Inventory Service** | `/api/v1/inventory` | [`docs/api/INVENTORY_SERVICE_API_DOCS.md`](file:///docs/api/INVENTORY_SERVICE_API_DOCS.md) | Stock tracking, low-stock threshold monitoring & automatic updates |
| **Marketing Service** | `/api/v1/marketing` | [`docs/api/MARKETING_SERVICE_API_DOCS.md`](file:///docs/api/MARKETING_SERVICE_API_DOCS.md) | Festival sale banners, discount coupons & promo calculations |
| **Notification Service** | SQS Async | [`docs/api/NOTIFICATION_SERVICE_API_DOCS.md`](file:///docs/api/NOTIFICATION_SERVICE_API_DOCS.md) | Transactional email dispatch via Nodemailer + Gmail SMTP |
| **Order Service** | `/api/v1/order` | [`docs/api/ORDER_SERVICE_API_DOCS.md`](file:///docs/api/ORDER_SERVICE_API_DOCS.md) | Order creation, lifecycle state engine & PDF invoices |
| **Payment Service** | `/api/v1/payments` | [`docs/api/PAYMENT_SERVICE_API_DOCS.md`](file:///docs/api/PAYMENT_SERVICE_API_DOCS.md) | Razorpay Gateway, UPI signature validation & COD handling |
| **Product Service** | `/api/v1/products` | [`docs/api/PRODUCT_SERVICE_API_DOCS.md`](file:///docs/api/PRODUCT_SERVICE_API_DOCS.md) | Product catalog CRUD, S3 uploads & CloudFront CDN URLs |
| **Review Service** | `/api/v1/reviews` | [`docs/api/REVIEW_SERVICE_API_DOCS.md`](file:///docs/api/REVIEW_SERVICE_API_DOCS.md) | Customer ratings, reviews submission & user-scoped deletion |
| **User Profile Service** | `/api/v1/user-profile` | [`docs/api/USER_PROFILE_SERVICE_API_DOCS.md`](file:///docs/api/USER_PROFILE_SERVICE_API_DOCS.md) | Profile metadata & saved shipping address management |
| **Wishlist Service** | `/api/v1/wishlist` | [`docs/api/WISHLIST_SERVICE_API_DOCS.md`](file:///docs/api/WISHLIST_SERVICE_API_DOCS.md) | Wishlist item persistence & interactive heart toggling |

---

## 🎨 Interactive Architecture Diagram
For a visual overview of the end-to-end cloud architecture, view [`docs/CloudBasket_Architecture.html`](file:///docs/CloudBasket_Architecture.html).

## 🧪 Postman API Testing Collection
Import [`docs/Cart-Service-Postman.postman_collection.json`](file:///docs/Cart-Service-Postman.postman_collection.json) into Postman for automated API endpoint testing.
