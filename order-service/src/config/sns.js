import "./env.js";
import { SNSClient } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
});

export { snsClient };
export default snsClient;