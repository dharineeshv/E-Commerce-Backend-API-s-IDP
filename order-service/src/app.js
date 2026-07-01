import "./config/env.js";
import express from "express";
import cors from "cors";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Order service is running" });
});

export default app;
