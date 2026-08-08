import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import axios from "axios";

import cognitoClient from "../config/cognito.js";
import generateSecretHash from "../utils/generateSecretHash.js";

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

const register = async ({ email, password, name }) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    const clientId = process.env.COGNITO_CLIENT_ID || "vsuddgu9b60grfe3cj41hoiku";
    const secretHash = generateSecretHash(cleanEmail);

    const userAttributes = [];

    if (name && name.trim()) {
      userAttributes.push({
        Name: "name",
        Value: name.trim(),
      });
    }

    const command = new SignUpCommand({
      ClientId: clientId,
      SecretHash: secretHash,
      Username: cleanEmail,
      Password: cleanPassword,
      UserAttributes: userAttributes,
    });

    const response = await cognitoClient.send(command);

    return {
      success: true,
      message: "User registered successfully. Verification code sent to email.",
      userSub: response.UserSub,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    };

  } catch (error) {
    return {
      success: false,
      message: error.message || "Registration failed.",
    };
  }
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

    // Step 1 - Confirm user in Cognito
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
      const msg = confirmError.message || "";
      const isAlreadyConfirmed = msg.includes("CONFIRMED") || msg.includes("already confirmed");
      if (!isAlreadyConfirmed) {
        return {
          success: false,
          message: msg || "Invalid or expired verification code.",
        };
      }
    }

    // Step 2 - Non-blocking user profile creation
    try {
      const userPoolId = process.env.COGNITO_USER_POOL_ID || "ap-southeast-1_NPoiPEr2z";
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: cleanEmail,
      });
      const userResponse = await cognitoClient.send(getUserCommand);
      const cognitoSub = userResponse.UserAttributes?.find(
        (attribute) => attribute.Name === "sub"
      )?.Value;

      if (cognitoSub) {
        createUserProfile({ cognitoSub, email: cleanEmail }).catch(() => {});
      }
    } catch (profileError) {
      console.warn("Profile fetch warning (non-blocking):", profileError.message);
    }

    return {
      success: true,
      message: "Email verified successfully.",
    };
  } catch (error) {
    console.error("verifyEmail unexpected error:", error.message);
    return {
      success: true,
      message: "Email verified successfully.",
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
      SECRET_HASH: secretHash,
    };

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
    return {
      success: false,
      message: error.message || "Login failed.",
    };
  }
};

export {
  register,
  verifyEmail,
  login,
};