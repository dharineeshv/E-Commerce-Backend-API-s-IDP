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
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: email,
    GroupName: "Customer",
  });

  await cognitoClient.send(command);
};
const register = async (userData) => {
  const { email, password } = userData;

  const command = new SignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
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

await addUserToCustomerGroup(email);

return {
  success: true,
  message: "User registered successfully. Please verify your email.",
  data: response,
};
}

const createUserProfile = async ({ cognitoSub, email }) => {
 const response = await axios.post(
  `${process.env.USER_PROFILE_SERVICE_URL}/api/v1/profile`,
  {
    cognitoSub,
    email,
  }
);

  return response.data;
};

const verifyEmail = async ({ email, confirmationCode }) => {
  try {

    // Step 1 - Confirm user
    const confirmCommand = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      SecretHash: generateSecretHash(email),
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    await cognitoClient.send(confirmCommand);

    // Step 2 - Get Cognito User Details
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
    });

    const userResponse = await cognitoClient.send(getUserCommand);

    // Step 3 - Extract Cognito Sub
    const cognitoSub = userResponse.UserAttributes.find(
      (attribute) => attribute.Name === "sub"
    )?.Value;

    // Step 4 - Create User Profile
    await createUserProfile({
      cognitoSub,
      email,
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

    console.log("================================");
    console.log("Login Email:", email);
    console.log("Password:", password);
    console.log("================================");

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",

      ClientId: process.env.COGNITO_CLIENT_ID,

      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: generateSecretHash(email),
      },
    });

    const response = await cognitoClient.send(command);

    console.log("================================");
    console.log("Access Token:");
    console.log(response.AuthenticationResult.AccessToken);
    console.log("================================");

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