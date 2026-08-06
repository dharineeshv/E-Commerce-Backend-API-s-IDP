import express from "express";
import * as reviewController from "../controllers/reviewController.js";
import cognitoAuthMiddleware from "../middlewares/cognitoAuthMiddleware.js";

const router = express.Router();

// Public route to fetch reviews for a product
router.get("/product/:productId", reviewController.getProductReviews);

// Protected routes (Requires valid JWT token)
router.post("/", cognitoAuthMiddleware, reviewController.addReview);
router.delete("/:reviewId", cognitoAuthMiddleware, reviewController.deleteReview);

export default router;
