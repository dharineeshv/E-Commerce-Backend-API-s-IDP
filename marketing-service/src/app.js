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
AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

const app = express();

app.use(cors());
app.use(express.json());

// X-Ray: open segment before routes
app.use(AWSXRay.express.openSegment("marketing-service"));

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
app.use(AWSXRay.express.closeSegment());

export default app;