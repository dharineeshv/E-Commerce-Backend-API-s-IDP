import "./config/env.js";
import express from "express";
import cors from "cors";
import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";
import reviewRoutes from "./routes/reviewRoutes.js";

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
  app.use(AWSXRay.express.openSegment("review-service"));
}

app.use("/api/v1/reviews", reviewRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "review-service",
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "CloudBasket Review & Rating Service is running",
  });
});

// X-Ray: close segment after routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.closeSegment());
}

export default app;
