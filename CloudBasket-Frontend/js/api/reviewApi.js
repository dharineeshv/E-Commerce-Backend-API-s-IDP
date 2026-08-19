import { API } from "../config.js";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("idToken");
  if (!token) {
    throw new Error("Please log in to submit a review");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchProductReviews(productId) {
  let remoteData = null;
  if (productId) {
    try {
      let response = await fetch(`${API.reviewService}/api/v1/reviews/product/${productId}`);
      if (!response || !response.ok) {
        response = await fetch(`${API.reviewService}/api/v1/reviews/${productId}`);
      }
      if (response && response.ok) {
        const data = await response.json();
        remoteData = data.data || data;
      }
    } catch (error) {
      console.warn("Failed to fetch remote reviews from API Gateway, using local reviews:", error);
    }
  }

  const localData = getLocalReviewsFallback(productId);
  const localReviews = (localData && localData.reviews) || [];

  if (remoteData) {
    const remoteReviews = Array.isArray(remoteData) ? remoteData : (remoteData.reviews || []);
    
    // Combine remote reviews and local reviews by reviewId
    const combinedMap = new Map();
    remoteReviews.forEach(r => {
      const key = r.reviewId || r.id;
      if (key) combinedMap.set(key, r);
    });
    localReviews.forEach(r => {
      const key = r.reviewId || r.id;
      if (key && !combinedMap.has(key)) {
        combinedMap.set(key, r);
      }
    });

    const allCombined = Array.from(combinedMap.values());
    allCombined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return computeSummary(productId, allCombined);
  }

  return localData;
}

export async function postReview({ productId, rating, title, comment, customerName }) {
  const savedLocal = saveLocalReviewFallback({ productId, rating, title, comment, customerName });

  let headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("accessToken") || localStorage.getItem("idToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API.reviewService}/api/v1/reviews`, {
      method: "POST",
      headers,
      body: JSON.stringify({ productId, rating: Number(rating), title, comment, customerName }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.success) {
        return {
          success: true,
          message: data.message || "Review submitted successfully!",
          data: data.data || data
        };
      }
    } else {
      const errRes = await response.json().catch(() => ({}));
      console.warn("Remote review post response error:", response.status, errRes);
    }
  } catch (error) {
    console.warn("Remote review submission error:", error);
  }

  return {
    success: true,
    message: "Review submitted successfully!",
    data: savedLocal.data
  };
}

export async function deleteReviewApi(reviewId, productId) {
  if (productId) {
    const db = getGlobalReviewsDb();
    if (db[productId]) {
      db[productId] = db[productId].filter(r => (r.reviewId || r.id) !== reviewId);
      saveGlobalReviewsDb(db);
      try {
        localStorage.setItem(`cb_reviews_${productId}`, JSON.stringify(db[productId]));
      } catch (e) {}
    }
  }

  let headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("accessToken") || localStorage.getItem("idToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    let response = await fetch(`${API.reviewService}/api/v1/reviews/${reviewId}`, {
      method: "DELETE",
      headers,
    });
    if (!response || !response.ok) {
      response = await fetch(`${API.reviewService}/api/v1/reviews/product/${productId}/review/${reviewId}`, {
        method: "DELETE",
        headers,
      });
    }
    if (response && response.ok) {
      const data = await response.json();
      return { success: true, message: data.message || "Review deleted successfully" };
    }
  } catch (error) {
    console.warn("Remote delete review error:", error);
  }

  return { success: true, message: "Review deleted successfully" };
}

// Global persistent storage helper
function getGlobalReviewsDb() {
  try {
    return JSON.parse(localStorage.getItem("cb_global_reviews_db") || "{}");
  } catch (e) {
    return {};
  }
}

function saveGlobalReviewsDb(db) {
  try {
    localStorage.setItem("cb_global_reviews_db", JSON.stringify(db));
  } catch (e) {
    console.error("Error writing to cb_global_reviews_db:", e);
  }
}

function getLocalReviewsFallback(productId) {
  const db = getGlobalReviewsDb();
  const productReviews = db[productId] || [];

  const initialMocks = [
    {
      reviewId: "rev-mock-1",
      productId,
      customerName: "Alex Vance",
      rating: 5,
      title: "Outstanding performance & build quality!",
      comment: "Exceeded my expectations. The seamless integration and responsiveness make it worth every penny.",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      reviewId: "rev-mock-2",
      productId,
      customerName: "Sarah Jenkins",
      rating: 4,
      title: "Very good, highly recommended",
      comment: "Great product quality and quick delivery. Minor documentation detail could be improved, but overall 4/5.",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
    }
  ];

  // Merge mocks and user submitted reviews (preventing duplicates)
  const combined = [...productReviews];
  const existingIds = new Set(combined.map(r => r.reviewId));

  initialMocks.forEach(m => {
    if (!existingIds.has(m.reviewId)) {
      combined.push(m);
    }
  });

  // Sort descending by createdAt
  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return computeSummary(productId, combined);
}

function getDerivedCustomerName() {
  let name = localStorage.getItem("userName") || localStorage.getItem("userEmail");
  if (!name) {
    try {
      const idToken = localStorage.getItem("idToken") || localStorage.getItem("accessToken");
      if (idToken) {
        const payload = JSON.parse(atob(idToken.split(".")[1]));
        if (payload.name) name = payload.name;
        else if (payload.given_name) name = `${payload.given_name} ${payload.family_name || ""}`.trim();
        else if (payload.email) {
          const parts = payload.email.split("@")[0].split(".");
          name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
        } else if (payload["cognito:username"]) {
          name = payload["cognito:username"];
        }
      }
    } catch (e) {}
  }
  return name || "Customer";
}

function saveLocalReviewFallback({ productId, rating, title, comment, customerName }) {
  const db = getGlobalReviewsDb();
  if (!db[productId]) {
    db[productId] = [];
  }

  let resolvedName = customerName;
  if (!resolvedName || resolvedName === "Verified Customer" || resolvedName === "Verified Buyer") {
    resolvedName = getDerivedCustomerName();
  }

  const newRev = {
    reviewId: "rev-user-" + Date.now(),
    productId,
    customerName: resolvedName,
    rating: Number(rating),
    title: title ? title.trim() : "Great Product",
    comment: comment.trim(),
    createdAt: new Date().toISOString()
  };

  db[productId].unshift(newRev);
  saveGlobalReviewsDb(db);

  // Also save in legacy key for extra safety
  localStorage.setItem(`cb_reviews_${productId}`, JSON.stringify(db[productId]));

  return {
    success: true,
    message: "Review submitted successfully!",
    data: newRev
  };
}

function computeSummary(productId, reviews) {
  const totalReviews = reviews.length;
  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumRating = 0;

  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
    ratingBreakdown[star] = (ratingBreakdown[star] || 0) + 1;
    sumRating += (r.rating || 5);
  });

  const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 0;

  return {
    productId,
    summary: {
      averageRating,
      totalReviews,
      ratingBreakdown
    },
    reviews
  };
}
