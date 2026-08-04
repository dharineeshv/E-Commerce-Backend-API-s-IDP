import express from "express";
import cors from "cors";
import AWSXRay from "aws-xray-sdk";
import http from "http";
import https from "https";
import errorMiddleware from "./middlewares/errorMiddleware.js";

// Capture all outbound HTTP/HTTPS calls
AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// X-Ray: open segment before routes
app.use(AWSXRay.express.openSegment("notification-service"));

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "OK",
        service: "notification-service"
    });
});

app.use(errorMiddleware);

// X-Ray: close segment after routes
app.use(AWSXRay.express.closeSegment());

export default app;