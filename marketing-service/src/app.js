import express from "express";
import cors from "cors";

import couponRoutes from "./routes/couponRoutes.js";

import errorMiddleware from "./middlewares/errorMiddleware.js";

import { API_VERSION } from "./constants/api.js";

import festivalSaleRoutes from "./routes/festivalSaleRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

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

export default app;