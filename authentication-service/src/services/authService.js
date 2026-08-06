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

const verifyEmail = async (payload) => {
  try {
    const rawEmail = payload?.email || payload?.username || "";
    const rawCode = payload?.confirmationCode || payload?.code || payload?.verificationCode || "";

    const cleanEmail = String(rawEmail).trim().toLowerCase();
    const cleanCode = String(rawCode).trim();

    if (!cleanEmail || !cleanCode) {
      return {
        success: false,
        message: "Email and verification code are required.",
      };
    }

    const clientId = process.env.COGNITO_CLIENT_ID || "vsuddgu9b60grfe3cj41hoiku";
    const userPoolId = process.env.COGNITO_USER_POOL_ID || "ap-southeast-1_NPoiPEr2z";

    // Step 1 - Confirm user
    try {
      const confirmCommand = new ConfirmSignUpCommand({
        ClientId: clientId,
        SecretHash: generateSecretHash(cleanEmail),
        Username: cleanEmail,
        ConfirmationCode: cleanCode,
      });
      await cognitoClient.send(confirmCommand);
    } catch (confirmError) {
      console.warn("Cognito ConfirmSignUp warning/error:", confirmError.message);
      if (!confirmError.message.includes("CONFIRMED") && !confirmError.message.includes("already confirmed")) {
        return {
          success: false,
          message: confirmError.message || "Invalid or expired verification code.",
        };
      }
    }

    // Step 2 - Get Cognito User Details & Create Profile asynchronously
    try {
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: cleanEmail,
      });
      const userResponse = await cognitoClient.send(getUserCommand);
      const cognitoSub = userResponse.UserAttributes?.find(
        (attribute) => attribute.Name === "sub"
      )?.Value;

      if (cognitoSub) {
        await createUserProfile({
          cognitoSub,
          email: cleanEmail,
        }).catch((e) => console.warn("User profile creation warning:", e.message));
      }
    } catch (profileError) {
      console.warn("Profile fetch warning:", profileError.message);
    }

    return {
      success: true,
      message: "Email verified successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Email verification failed.",
    };
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