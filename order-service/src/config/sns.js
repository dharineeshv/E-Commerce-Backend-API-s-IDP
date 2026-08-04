import "./env.js";
import { SNSClient } from "@aws-sdk/client-sns";
import AWSXRay from "aws-xray-sdk";

const snsClient = AWSXRay.captureAWSv3Client(
  new SNSClient({
    region: process.env.AWS_REGION,
  })
);

export { snsClient };
export default snsClient;
