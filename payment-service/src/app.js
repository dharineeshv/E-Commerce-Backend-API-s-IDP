import "./config/env.js";
import express from "express";
import cors from "cors";
import paymentRoutes from "./routes/paymentRoutes.js";
import { API_VERSION } from "./constants/api.js";

const app = express();
app.use(express.json());
app.use(cors());

app.use(`${API_VERSION}/payment`, paymentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Payment service is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

export default app;
