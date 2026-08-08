import "./config/env.js";
import express from "express";
import cors from "cors";
import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";
import paymentRoutes from "./routes/paymentRoutes.js";
import razorpayRoutes from "./routes/razorpayRoutes.js";
import { API_VERSION } from "./constants/api.js";

// Capture all outbound HTTP/HTTPS calls
AWSXRay.setContextMissingStrategy("LOG_ERROR");
AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

const app = express();
app.disable("x-powered-by");
app.use(express.json());
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(",") 
    : ["https://d2vghmouksu39n.cloudfront.net", "https://d29i6xvt5mglve.cloudfront.net", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
};
app.use(cors(corsOptions));

// X-Ray: open segment before routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.openSegment("payment-service"));
}

app.use(`${API_VERSION}/payment/razorpay`, razorpayRoutes);
app.use(`${API_VERSION}/payment`, paymentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Payment service is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// X-Ray: close segment after routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.closeSegment());
}

export default app;
