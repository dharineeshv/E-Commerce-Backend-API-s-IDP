import "../config/env.js";
import { CognitoJwtVerifier } from "aws-jwt-verify";


const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: [process.env.COGNITO_CLIENT_ID, "4i9ucuisno2545vd77lngcps27", "vsuddgu9b60grfe3cj41hoiku"],
});

const cognitoAuthMiddleware = async (req, res, next) => {
  try {
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

    console.log("Authenticated User:");
    console.log(payload);

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
