import "./config/env.js";

import express from "express";
import cors from "cors";

import userProfileRoutes from "./routes/userProfileRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/profile", userProfileRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "user-profile-service",
  });
});

export default app;