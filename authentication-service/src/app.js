import "./config/env.js";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { API_VERSION } from "./constants/api.js";

const app = express();

app.use(express.json());
app.use(cors());

app.use(`${API_VERSION}/auth`, authRoutes);

export default app;