import {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AdminGetUserCommand,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import axios from "axios";

import cognitoClient from "../config/cognito.js";
import generateSecretHash from "../utils/generateSecretHash.js";

const addUserToCustomerGroup = async (email) => {
  const command = new AdminAddUserToGroupCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID || "ap-southeast-1_NPoiPEr2z",
    Username: email,
    GroupName: "Customer",
  });

  await cognitoClient.send(command);
};

const register = async (userData) => {
  const email = (userData.email || "").trim().toLowerCase();
  const password = (userData.password || "").trim();

  const clientId = process.env.COGNITO_CLIENT_ID || "vsuddgu9b60grfe3cj41hoiku";

  const command = new SignUpCommand({
    ClientId: clientId,
    SecretHash: generateSecretHash(email),
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  });

  const response = await cognitoClient.send(command);

  try {
    await addUserToCustomerGroup(email);
  } catch (e) {
    console.warn("Could not add user to Customer group:", e.message);
  }

  return {
    success: true,
    message: "User registered successfully. Please verify your email.",
    data: response,
  };
};

const createUserProfile = async ({ cognitoSub, email }) => {
  const profileServiceUrl = process.env.USER_PROFILE_SERVICE_URL || "https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com";
  const response = await axios.post(
    `${profileServiceUrl}/api/v1/profile`,
    {
      cognitoSub,
      email,
    }
  );

  return response.data;
};

const verifyEmail = async ({ email, confirmationCode }) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (confirmationCode || "").trim();

    const clientId = process.env.COGNITO_CLIENT_ID || "vsuddgu9b60grfe3cj41hoiku";
    const userPoolId = process.env.COGNITO_USER_POOL_ID || "ap-southeast-1_NPoiPEr2z";

    // Step 1 - Confirm user
    const confirmCommand = new ConfirmSignUpCommand({
      ClientId: clientId,
      SecretHash: generateSecretHash(cleanEmail),
      Username: cleanEmail,
      ConfirmationCode: cleanCode,
    });

    await cognitoClient.send(confirmCommand);

    // Step 2 - Get Cognito User Details
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: cleanEmail,
    });

    const userResponse = await cognitoClient.send(getUserCommand);

    // Step 3 - Extract Cognito Sub
    const cognitoSub = userResponse.UserAttributes?.find(
      (attribute) => attribute.Name === "sub"
    )?.Value;

    // Step 4 - Create User Profile
    await createUserProfile({
      cognitoSub,
      email: cleanEmail,
    });

    return {
      success: true,
      message: "Email verified successfully. User profile created.",
    };

  } catch (error) {
    throw new Error(error.message);
  }
};

const login = async ({ email, password }) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    const clientId = process.env.COGNITO_CLIENT_ID || "vsuddgu9b60grfe3cj41hoiku";
    const secretHash = generateSecretHash(cleanEmail);

    const authParameters = {
      USERNAME: cleanEmail,
      PASSWORD: cleanPassword,
    };
    if (secretHash) {
      authParameters.SECRET_HASH = secretHash;
    }

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: authParameters,
    });

    const response = await cognitoClient.send(command);

    return {
      success: true,
      message: "Login successful.",
      data: {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
        tokenType: response.AuthenticationResult.TokenType,
      },
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export {
  register,
  verifyEmail,
  login,
};