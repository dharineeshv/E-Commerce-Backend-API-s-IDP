import "./src/config/env.js";
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";

const credentials = process.env.AWS_PROFILE
  ? fromIni({ profile: process.env.AWS_PROFILE })
  : undefined;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials,
});

const createOrdersTable = async () => {
  try {
    // Check if table already exists
    await client.send(new DescribeTableCommand({ TableName: "Orders" }));
    console.log("Orders table already exists.");
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      console.log("Creating Orders table...");

      const params = {
        TableName: "Orders",
        AttributeDefinitions: [
          { AttributeName: "orderId", AttributeType: "S" },
          { AttributeName: "customerId", AttributeType: "S" },
        ],
        KeySchema: [
          { AttributeName: "orderId", KeyType: "HASH" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "customerId-index",
            KeySchema: [
              { AttributeName: "customerId", KeyType: "HASH" },
            ],
            Projection: { ProjectionType: "ALL" },
            BillingMode: "PAY_PER_REQUEST",
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      };

      await client.send(new CreateTableCommand(params));
      console.log("Orders table created successfully!");
    } else {
      throw error;
    }
  }
};

createOrdersTable().catch(console.error);
