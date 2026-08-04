import "../config/env.js";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import AWSXRay from "aws-xray-sdk";

const cognitoClient = AWSXRay.captureAWSv3Client(
  new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
  })
);

export default cognitoClient;