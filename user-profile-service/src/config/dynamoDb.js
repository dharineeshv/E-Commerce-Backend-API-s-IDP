import "../config/env.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import AWSXRay from "aws-xray-sdk";

const client = AWSXRay.captureAWSv3Client(
  new DynamoDBClient({
    region: process.env.AWS_REGION,
  })
);

const docClient = DynamoDBDocumentClient.from(client);

export default docClient;