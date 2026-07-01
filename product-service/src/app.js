import dotenv from 'dotenv';
import express from 'express';
import productRoutes from './routes/productRoutes.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;