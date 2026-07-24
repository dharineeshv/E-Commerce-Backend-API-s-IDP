import "./config/env.js";
import express from "express";
import cors from "cors";
import reviewRoutes from "./routes/reviewRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

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

export default app;
