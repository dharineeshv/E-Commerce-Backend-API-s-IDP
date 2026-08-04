import "./config/env.js";
import express from "express";
import cors from "cors";
import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";
import wishlistRoutes from "./routes/wishlistRoutes.js";

// Capture all outbound HTTP/HTTPS calls
AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

const app = express();

app.use(express.json());
app.use(cors());

// X-Ray: open segment before routes
app.use(AWSXRay.express.openSegment("wishlist-service"));

app.use("/api/v1/wishlist", wishlistRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "wishlist-service",
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Wishlist service is running",
  });
});

// X-Ray: close segment after routes
app.use(AWSXRay.express.closeSegment());

export default app;
