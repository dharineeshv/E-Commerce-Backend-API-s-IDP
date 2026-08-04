import "./config/env.js";
import express from "express";
import cors from "cors";
import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";
import authRoutes from "./routes/authRoutes.js";
import { API_VERSION } from "./constants/api.js";

// Capture all outbound HTTP/HTTPS calls
AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

const app = express();

app.use(express.json());
app.use(cors());

// X-Ray: open segment before routes
app.use(AWSXRay.express.openSegment("authentication-service"));

app.use(`${API_VERSION}/auth`, authRoutes);

// X-Ray: close segment after routes
app.use(AWSXRay.express.closeSegment());

export default app;