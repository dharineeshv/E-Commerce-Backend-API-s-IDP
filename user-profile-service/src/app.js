import "./config/env.js";
import { API_VERSION } from "./constants/api.js";
import express from "express";
import cors from "cors";

import userProfileRoutes from "./routes/userProfileRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(`${API_VERSION}/profile`, userProfileRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "user-profile-service",
  });
});

export default app;