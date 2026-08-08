# Product Service Microservice

This is the backend microservice for Product Management in the industrial-level multi-vendor e-commerce platform.

## Features
- Add Product
- Get All Products
- Get Product By ID
- Update Product
- Delete Product

## Folder Structure

- `src/server.js` - Express application bootstrap
- `src/routes/productRoutes.js` - Product API routes
- `src/controllers/productController.js` - Controller layer
- `src/services/productService.js` - DynamoDB integration and product logic
- `src/middlewares/errorMiddleware.js` - Error handling
- `src/seed/seedProducts.js` - Seed sample products into DynamoDB
- `.env.example` - Example environment configuration

## Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set DynamoDB environment variables in `.env`:
   ```env
   PORT=5000
   AWS_REGION=ap-southeast-2
   DYNAMODB_TABLE=Products
   AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
   ``` 
4. Use your real AWS credentials and the existing `Products` table with partition key `productId`.
```bash
npm run dev
```

## Seed Sample Products

```bash
npm run seed
```

## API Endpoints

Base URL: `http://localhost:5000/api/products`

### Add Product
- Method: `POST`
- URL: `/`
- Body:
  ```json
  {
    "name": "Product name",
    "description": "Product description",
    "price": 49.99,
    "quantity": 100,
    "category": "Category",
    "imageUrl": "https://example.com/image.jpg"
  }
  ```
- Success Response:
  ```json
  {
    "success": true,
    "message": "Product added successfully",
    "product": { ... }
  }
  ```

### Get All Products
- Method: `GET`
- URL: `/`
- Success Response:
  ```json
  {
    "success": true,
    "products": [ ... ]
  }
  ```

### Get Product By ID
- Method: `GET`
- URL: `/:id`
- Success Response:
  ```json
  {
    "success": true,
    "product": { ... }
  }
  ```

### Update Product
- Method: `PUT`
- URL: `/:id`
- Body (any updatable fields):
  ```json
  {
    "price": 59.99,
    "quantity": 120
  }
  ```
- Success Response:
  ```json
  {
    "success": true,
    "message": "Product updated successfully",
    "product": { ... }
  }
  ```

### Delete Product
- Method: `DELETE`
- URL: `/:id`
- Success Response:
  ```json
  {
    "success": true,
    "message": "Product deleted successfully"
  }
  ```

## Postman Testing
1. Start server: `npm run dev`
2. Create requests in Postman for each endpoint.
3. Use `http://localhost:5000/api/products` as base.
4. Verify responses in Postman.

## Notes
- This service uses AWS DynamoDB through AWS SDK v3.
- For local development, use DynamoDB local or configure AWS credentials.
