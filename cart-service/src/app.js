import "./config/env.js";
import express from "express";
import cors from "cors";
import cartRoutes from "./routes/cartRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/cart", cartRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Cart service is running" });
});

export default app;
