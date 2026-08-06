import "./config/env.js";
import express from "express";
import cors from "cors";
import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";
import cartRoutes from "./routes/cartRoutes.js";

// Capture all outbound HTTP/HTTPS calls
AWSXRay.setContextMissingStrategy("LOG_ERROR");
AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

const app = express();
app.disable("x-powered-by");

app.use(express.json());
app.use(cors());

// X-Ray: open segment before routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.openSegment("cart-service"));
}

app.use("/api/v1/cart", cartRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "cart-service",
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Cart service is running",
  });
});

// X-Ray: close segment after routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.closeSegment());
}

export default app;