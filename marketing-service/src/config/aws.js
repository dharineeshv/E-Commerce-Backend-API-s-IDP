import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "./env.js";
import AWSXRay from "aws-xray-sdk";

const client = AWSXRay.captureAWSv3Client(
    new DynamoDBClient({
        region: env.AWS_REGION
    })
);

export const dynamoDb = DynamoDBDocumentClient.from(client);