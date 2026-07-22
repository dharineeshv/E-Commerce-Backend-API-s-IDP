import express from "express";
import * as wishlistController from "../controllers/wishlistController.js";
import cognitoAuthMiddleware from "../middlewares/cognitoAuthMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(cognitoAuthMiddleware);

router.post("/", wishlistController.addProductToWishlist);
router.get("/:customerId", wishlistController.getWishlist);
router.delete("/:customerId/:productId", wishlistController.removeProductFromWishlist);
router.delete("/:customerId", wishlistController.clearWishlist);
router.get("/:customerId/check/:productId", wishlistController.checkProductInWishlist);

export default router;
