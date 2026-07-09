import express from "express";
import {
  createProfile,
  getProfileBySub,
} from "../controllers/userProfileController.js";

const router = express.Router();

router.post("/", createProfile);

// Get profile using Cognito Sub
router.get("/me/:cognitoSub", getProfileBySub);

export default router;