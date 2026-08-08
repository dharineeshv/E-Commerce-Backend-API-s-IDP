import express from "express";
import cors from "cors";
import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";
import errorMiddleware from "./middlewares/errorMiddleware.js";

// Capture all outbound HTTP/HTTPS calls
AWSXRay.setContextMissingStrategy("LOG_ERROR");
AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

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
app.use(express.urlencoded({ extended: true }));

// X-Ray: open segment before routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.openSegment("notification-service"));
}

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "OK",
        service: "notification-service"
    });
});

app.use(errorMiddleware);

// X-Ray: close segment after routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.closeSegment());
}

export default app;