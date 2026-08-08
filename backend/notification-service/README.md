# Notification Service

This service provides a lightweight notification endpoint for the e-commerce platform.

## Endpoints

- GET /health
- POST /notifications/send

### Example request

```bash
curl -X POST http://localhost:3005/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "subject": "Order confirmation",
    "message": "Your order has been placed successfully."
  }'
```

## Configuration

Set SMTP credentials in the .env file before sending real emails.
