import { CognitoJwtVerifier } from "aws-jwt-verify";

let verifier = null;

const cognitoAuthMiddleware = async (req, res, next) => {
  try {
    if (!verifier) {
      const clientIds = [process.env.COGNITO_CLIENT_ID].filter(Boolean);
      verifier = CognitoJwtVerifier.create({
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        tokenUse: "access",
        clientId: clientIds.length > 0 ? clientIds : null,
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header is missing.",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = authHeader.split(" ")[1];

    const payload = await verifier.verify(token);

    req.user = payload;

    next();

  } catch (error) {

    console.error("JWT Verification Failed:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });

  }
};

export default cognitoAuthMiddleware;
