import express from "express";
import {
  createProfile,
  getProfileBySub,
  getProfileByCustomerId,
  updateProfile,
  deleteProfile,
  getMyProfile,
  updateMyProfile,
  getAllProfiles,
} from "../controllers/userProfileController.js";

import cognitoAuthMiddleware from "../middlewares/cognitoAuthMiddleware.js";
import authorizeRoles from "../middlewares/authorizeRoles.js";

const router = express.Router();

// -------------------------
// Internal APIs
// -------------------------

// Called by Auth Service
router.post("/", createProfile);

// Called by Cart, Order & Payment Services
router.get("/me/:cognitoSub", getProfileBySub);

// -------------------------
// Customer APIs
// -------------------------
router.get(
    "/me",
    cognitoAuthMiddleware,
    authorizeRoles("Customer", "Admin"),
    getMyProfile
);

router.put(
  "/me",
  cognitoAuthMiddleware,
  authorizeRoles("Customer"),
  updateMyProfile
);

// -------------------------
// Admin APIs
// -------------------------

router.get(
  "/admin/all",
  getAllProfiles
);

router.get(
  "/all",
  getAllProfiles
);

router.get(
  "/:customerId",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  getProfileByCustomerId
);

router.put(
  "/:customerId",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  updateProfile
);

router.delete(
  "/:customerId",
  cognitoAuthMiddleware,
  authorizeRoles("Admin"),
  deleteProfile
);

export default router;