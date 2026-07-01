import "./env.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";

if (!process.env.AWS_SDK_LOAD_CONFIG) {
  process.env.AWS_SDK_LOAD_CONFIG = "1";
}

const credentials = process.env.AWS_PROFILE
  ? fromIni({ profile: process.env.AWS_PROFILE })
  : undefined;

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials,
});

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

export default dynamodb;
