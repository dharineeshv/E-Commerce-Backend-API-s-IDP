import * as authService from "../services/authService.js";

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Registration failed.",
    });
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Email verification failed.",
    });
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message || "Login failed.",
    });
  }
};

export {
  register,
  verifyEmail,
  login,
};