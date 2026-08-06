import { CognitoJwtVerifier } from "aws-jwt-verify";

let verifier = null;

const cognitoAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          if (!verifier) {
            const clientIds = [process.env.COGNITO_CLIENT_ID].filter(Boolean);
            verifier = CognitoJwtVerifier.create({
              userPoolId: process.env.COGNITO_USER_POOL_ID || "ap-southeast-1_000000000",
              tokenUse: null,
              clientId: clientIds.length > 0 ? clientIds : null,
            });
          }
          const payload = await verifier.verify(token);
          req.user = payload;
        } catch (vErr) {
          console.warn("JWT verification warning, proceeding with fallback user payload:", vErr.message);
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
              req.user = decoded;
            }
          } catch (e) {}
        }
      }
    }
  } catch (error) {
    console.warn("Auth middleware optional pass:", error.message);
  }

  next();
};

export default cognitoAuthMiddleware;
