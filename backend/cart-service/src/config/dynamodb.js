import "./env.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
});

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

export default dynamodb;