import express from "express";
import cors from "cors";
import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";
import couponRoutes from "./routes/couponRoutes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import { API_VERSION } from "./constants/api.js";
import festivalSaleRoutes from "./routes/festivalSaleRoutes.js";

// Capture all outbound HTTP/HTTPS calls
AWSXRay.setContextMissingStrategy("LOG_ERROR");
AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

const app = express();
app.disable("x-powered-by");

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// X-Ray: open segment before routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.openSegment("marketing-service"));
}

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "marketing-service"
    });
});

app.use(`${API_VERSION}/marketing`, couponRoutes);
app.use(`${API_VERSION}/marketing`, festivalSaleRoutes);

// Error Middleware (Always Last)
app.use(errorMiddleware);

// X-Ray: close segment after routes
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(AWSXRay.express.closeSegment());
}

export default app;