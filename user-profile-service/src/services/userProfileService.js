import {
  PutCommand,
  UpdateCommand,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

import docClient from "../config/dynamoDb.js";


const generateCustomerId = async () => {
  const response = await docClient.send(
    new UpdateCommand({
      TableName: process.env.USER_COUNTER_TABLE,

      Key: {
        counterName: "customerId",
      },

      UpdateExpression:
        "SET currentValue = if_not_exists(currentValue, :start) + :increment",

      ExpressionAttributeValues: {
        ":start": 0,
        ":increment": 1,
      },

      ReturnValues: "UPDATED_NEW",
    })
  );

  const currentValue = response.Attributes.currentValue;

  return `cust-${String(currentValue).padStart(3, "0")}`;
};

const getProfileByCognitoSub = async (cognitoSub) => {

  console.log("==================================");
  console.log("Searching Cognito Sub:", cognitoSub);

  const response = await docClient.send(
    new QueryCommand({
      TableName: process.env.USER_PROFILE_TABLE,

      IndexName: "CognitoSubIndex",

      KeyConditionExpression: "cognitoSub = :cognitoSub",

      ExpressionAttributeValues: {
        ":cognitoSub": cognitoSub,
      },
    })
  );

  console.log("Items Returned:");
  console.log(JSON.stringify(response.Items, null, 2));
  console.log("==================================");

  return response.Items?.[0] || null;
};

const getProfileBySub = async (cognitoSub) => {

  const profile = await getProfileByCognitoSub(cognitoSub);

  if (!profile) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    success: true,
    data: profile,
  };
};

const createProfile = async (profileData) => {
  const {
    cognitoSub,
    email,
    fullName = "",
    phoneNumber = "",
  } = profileData;

  const existingProfile =
    await getProfileByCognitoSub(cognitoSub);

if (existingProfile) {
  const error = new Error("User profile already exists.");
  error.statusCode = 409;
  throw error;
}
  const customerId = await generateCustomerId();

  const profile = {
    customerId,
    cognitoSub,
    email,
    fullName,
    phoneNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: process.env.USER_PROFILE_TABLE,
      Item: profile,
    })
  );

  return {
    success: true,
    message: "User profile created successfully.",
    data: profile,
  };
};

export {
  createProfile,
  getProfileBySub,
};