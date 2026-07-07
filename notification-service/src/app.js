import express from "express";
import cors from "cors";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "OK",
        service: "notification-service"
    });
});

app.use(errorMiddleware);

export default app;