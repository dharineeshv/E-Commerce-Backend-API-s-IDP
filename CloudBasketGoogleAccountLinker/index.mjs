import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminLinkProviderForUserCommand
} from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProviderClient({
  region: "ap-southeast-1"
});

export const handler = async (event) => {
  console.log("Received event:");
  console.log(JSON.stringify(event, null, 2));

  // Only process Google/Federated sign-ins
  if (event.triggerSource !== "PreSignUp_ExternalProvider") {
    return event;
  }

  const email = event.request.userAttributes.email;

  if (!email) {
    console.log("Email not found.");
    return event;
  }

  try {
    // Search for existing Cognito user with the same email
    const listUsersResponse = await cognito.send(
      new ListUsersCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Filter: `email = "${email}"`
      })
    );

    const existingUser = listUsersResponse.Users?.find(
      user => user.Username !== event.userName
    );

    if (existingUser) {
      console.log(`Existing user found: ${existingUser.Username}`);

      // Google username format:
      // Google_123456789012345678901
      const googleSubject = event.userName.split("_")[1];

      await cognito.send(
        new AdminLinkProviderForUserCommand({
          UserPoolId: process.env.USER_POOL_ID,

          DestinationUser: {
            ProviderName: "Cognito",
            ProviderAttributeValue: existingUser.Username
          },

          SourceUser: {
            ProviderName: "Google",
            ProviderAttributeName: "Cognito_Subject",
            ProviderAttributeValue: googleSubject
          }
        })
      );

      console.log("Google account linked successfully.");
    } else {
      console.log("No existing user found. Cognito will create a new user.");
    }

    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;

    return event;

  } catch (error) {
    console.error("Account linking failed:", error);
    throw error;
  }
};