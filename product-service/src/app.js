import dotenv from 'dotenv';
import express from 'express';
import productRoutes from './routes/productRoutes.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import cognitoAuthMiddleware from "./middlewares/cognitoAuthMiddleware.js";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/health", cognitoAuthMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    service: "product-service",
    message: "JWT Verified Successfully",
    user: req.user,
  });
});

app.use('/api/v1/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;