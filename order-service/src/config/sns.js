import "./env.js";
import { SNSClient } from "@aws-sdk/client-sns";

const region = process.env.AWS_REGION;

const snsClient = new SNSClient({
	region,
});

export { snsClient };
export default snsClient;
