import express from "express";
import {
  register,
  verifyEmail,
  login,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);

router.post("/verify", verifyEmail);

router.post("/login", login);

export default router;