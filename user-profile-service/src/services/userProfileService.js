import {
  PutCommand,
  UpdateCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand,
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

  return response.Items?.[0] || null;
};

const getProfileBySub = async (cognitoSub) => {

  let profile = await getProfileByCognitoSub(cognitoSub);

  if (!profile) {
    await createProfile({ cognitoSub, email: "google-sso-user@example.com" });
    profile = await getProfileByCognitoSub(cognitoSub);
  }

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

const getProfileByCustomerId = async (customerId) => {

  const response = await docClient.send(
    new GetCommand({
      TableName: process.env.USER_PROFILE_TABLE,
      Key: {
        customerId,
      },
    })
  );

  if (!response.Item) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    success: true,
    data: response.Item,
  };

};

const getMyProfile = async (cognitoSub) => {

  // Find profile using Cognito Sub
  let profile = await getProfileByCognitoSub(cognitoSub);

  if (!profile) {
    await createProfile({ cognitoSub, email: "google-sso-user@example.com" });
    profile = await getProfileByCognitoSub(cognitoSub);
  }

  if (!profile) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }

  // Reuse existing method
  return await getProfileByCustomerId(profile.customerId);

};

const updateMyProfile = async (cognitoSub, updates) => {

  // Find profile using Cognito Sub
  const profile = await getProfileByCognitoSub(cognitoSub);

  if (!profile) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }

  // Reuse existing update method
  return await updateProfile(profile.customerId, updates);

};

const updateProfile = async (customerId, updates) => {

  const existingProfile = await docClient.send(
    new GetCommand({
      TableName: process.env.USER_PROFILE_TABLE,
      Key: {
        customerId,
      },
    })
  );

  if (!existingProfile.Item) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }

  const response = await docClient.send(
    new UpdateCommand({
      TableName: process.env.USER_PROFILE_TABLE,

      Key: {
        customerId,
      },

      UpdateExpression:
        "SET fullName = :fullName, phoneNumber = :phoneNumber, updatedAt = :updatedAt",

      ExpressionAttributeValues: {
        ":fullName":
          updates.fullName ??
          existingProfile.Item.fullName,

        ":phoneNumber":
          updates.phoneNumber ??
          existingProfile.Item.phoneNumber,

        ":updatedAt":
          new Date().toISOString(),
      },

      ReturnValues: "ALL_NEW",
    })
  );

  return {
    success: true,
    message: "Profile updated successfully.",
    data: response.Attributes,
  };

};

const deleteProfile = async (customerId) => {

  const existingProfile = await docClient.send(
    new GetCommand({
      TableName: process.env.USER_PROFILE_TABLE,
      Key: {
        customerId,
      },
    })
  );

  if (!existingProfile.Item) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }

  await docClient.send(
    new DeleteCommand({
      TableName: process.env.USER_PROFILE_TABLE,
      Key: {
        customerId,
      },
    })
  );

  return {
    success: true,
    message: "User profile deleted successfully.",
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

const getAllProfiles = async () => {
  const response = await docClient.send(
    new ScanCommand({
      TableName: process.env.USER_PROFILE_TABLE,
    })
  );

  return {
    success: true,
    data: response.Items || [],
  };
};

export {
  createProfile,
  getProfileBySub,
  getMyProfile,
  updateMyProfile,
  getProfileByCustomerId,
  updateProfile,
  deleteProfile,
  getAllProfiles,
};