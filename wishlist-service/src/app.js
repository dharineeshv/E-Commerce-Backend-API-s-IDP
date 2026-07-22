import "./config/env.js";
import express from "express";
import cors from "cors";
import wishlistRoutes from "./routes/wishlistRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

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

export default app;
