import dotenv from 'dotenv';
import express from 'express';
import AWSXRay from 'aws-xray-sdk';
import http from 'http';
import https from 'https';
import productRoutes from './routes/productRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import cognitoAuthMiddleware from "./middlewares/cognitoAuthMiddleware.js";

dotenv.config();

// Capture all outbound HTTP/HTTPS calls
AWSXRay.setContextMissingStrategy("LOG_ERROR");
AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

const app = express();
app.disable("x-powered-by");

app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "x-api-key"]
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, x-api-key");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// X-Ray: open segment before routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.openSegment('product-service'));
}

app.get("/health", cognitoAuthMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    service: "product-service",
    message: "JWT Verified Successfully",
    user: req.user,
  });
});

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/reviews', reviewRoutes);

app.use(notFound);
app.use(errorHandler);

// X-Ray: close segment after routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.closeSegment());
}

export default app;