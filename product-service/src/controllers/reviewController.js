import * as reviewService from "../services/reviewService.js";

export async function addReview(req, res) {
  try {
    const { productId, rating, title, comment, customerName } = req.body;
    const customerId = req.user ? (req.user.sub || req.user.username) : "anonymous";
    const name = customerName || (req.user ? (req.user.name || req.user.email || "Verified Customer") : "Verified Customer");

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5 stars" });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: "Review comment is required" });
    }

    const newReview = await reviewService.addReview({
      productId,
      customerId,
      customerName: name,
      rating: Number(rating),
      title,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully!",
      data: newReview,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add review",
    });
  }
}

export async function getProductReviews(req, res) {
  try {
    const productId = req.params.productId || req.params[0] || req.query.productId;

    if (!productId) {
      return res.status(200).json({
        success: true,
        data: {
          productId: "",
          summary: { totalReviews: 0, averageRating: 5.0, ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
          reviews: []
        }
      });
    }

    const data = await reviewService.getProductReviews(productId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.warn("Error fetching reviews, returning resilient fallback payload:", error.message);
    const fallbackPid = req.params.productId || req.params[0] || req.query.productId || "";
    return res.status(200).json({
      success: true,
      data: {
        productId: fallbackPid,
        summary: { totalReviews: 0, averageRating: 5.0, ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        reviews: []
      }
    });
  }
}

export async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;
    const customerId = req.user ? (req.user.sub || req.user.username) : null;

    if (!reviewId) {
      return res.status(400).json({ success: false, message: "reviewId is required" });
    }

    const result = await reviewService.deleteReview(reviewId, customerId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete review",
    });
  }
}
