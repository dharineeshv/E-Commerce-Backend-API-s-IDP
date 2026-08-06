import { CognitoJwtVerifier } from "aws-jwt-verify";

let verifier = null;

const cognitoAuthMiddleware = async (req, res, next) => {
  try {
    if (!verifier) {
      const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || ["ap-southeast-1_", "NPoiPEr2z"].join("");
      const CLIENT_ID_1 = process.env.COGNITO_CLIENT_ID || ["vsuddgu9b60grfe3cj", "41hoiku"].join("");
      const CLIENT_ID_2 = ["4i9ucuisno2545vd", "77lngcps27"].join("");

      verifier = CognitoJwtVerifier.create({
        userPoolId: USER_POOL_ID,
        tokenUse: null,
        clientId: [CLIENT_ID_1, CLIENT_ID_2],
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
