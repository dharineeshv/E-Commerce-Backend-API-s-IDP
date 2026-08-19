import crypto from "crypto";

const generateSecretHash = (username) => {
  let secret = process.env.COGNITO_CLIENT_SECRET;
  const clientId = process.env.COGNITO_CLIENT_ID || "vsuddgu9b60grfe3cj41hoiku";
  
  if (!secret && clientId === "vsuddgu9b60grfe3cj41hoiku") {
     secret = "t53bkaif79fcdgko3vho26f55tuc7lu00nut2t8mvt3avn7f39b";
  }

  if (!secret || !secret.trim()) {
    return undefined;
  }
  return crypto
    .createHmac("sha256", secret.trim())
    .update(username + clientId)
    .digest("base64");
};

export default generateSecretHash;
