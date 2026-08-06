import "../config/env.js";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

const REGION = process.env.AWS_REGION || "ap-southeast-1";
const cognitoClient = new CognitoIdentityProviderClient({
  region: REGION,
});

export default cognitoClient;