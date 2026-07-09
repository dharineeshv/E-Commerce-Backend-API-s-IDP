import crypto from "crypto";

const generateSecretHash = (username) => {
  return crypto
    .createHmac("sha256", process.env.COGNITO_CLIENT_SECRET)
    .update(username + process.env.COGNITO_CLIENT_ID)
    .digest("base64");
};

export default generateSecretHash;