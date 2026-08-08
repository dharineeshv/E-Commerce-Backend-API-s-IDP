import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
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
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  try {
    AWSXRay.captureHTTPsGlobal(http, true);
    AWSXRay.captureHTTPsGlobal(https, true);
  } catch (e) {}
}

const app = express();
app.disable("x-powered-by");

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(",") 
    : ["https://d2vghmouksu39n.cloudfront.net", "https://d29i6xvt5mglve.cloudfront.net", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
};
app.use(cors(corsOptions));
app.use(express.json());

// X-Ray: open segment before routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.openSegment('product-service'));
}

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "product-service",
    message: "Product service is running"
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