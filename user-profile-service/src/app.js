import "./config/env.js";
import { API_VERSION } from "./constants/api.js";
import express from "express";
import cors from "cors";
import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";
import userProfileRoutes from "./routes/userProfileRoutes.js";

// Capture all outbound HTTP/HTTPS calls
AWSXRay.setContextMissingStrategy("LOG_ERROR");
AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

const app = express();
app.disable("x-powered-by");

app.use(cors());
app.use(express.json());

// X-Ray: open segment before routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.openSegment("user-profile-service"));
}

app.use(`${API_VERSION}/profile`, userProfileRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "user-profile-service",
  });
});

// X-Ray: close segment after routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.closeSegment());
}

export default app;