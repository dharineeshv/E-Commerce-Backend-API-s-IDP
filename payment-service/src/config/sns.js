import "./env.js";
import { SNSClient } from "@aws-sdk/client-sns";
import { fromIni } from "@aws-sdk/credential-providers";

const credentials = process.env.AWS_PROFILE
  ? fromIni({ profile: process.env.AWS_PROFILE })
  : undefined;

const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials,
});

export { snsClient };
