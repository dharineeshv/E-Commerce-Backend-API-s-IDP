import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { env } from "./env.js";

const client = new DynamoDBClient({

    region: env.AWS_REGION

});

export const dynamoDb = DynamoDBDocumentClient.from(client);