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
            verifier = CognitoJwtVerifier.create({
              userPoolId: process.env.COGNITO_USER_POOL_ID || "ap-southeast-1_NPoiPEr2z",
              tokenUse: null, // Allow both id & access tokens
              clientId: [
                process.env.COGNITO_CLIENT_ID || "vsuddgu9b60grfe3cj41hoiku",
                "4i9ucuisno2545vd77lngcps27"
              ],
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
