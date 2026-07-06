import "../config/env.js";
import { PublishCommand } from "@aws-sdk/client-sns";
import { snsClient } from "../config/sns.js";

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

const publishEvent = async (eventType, payload) => {
  try {
    const message = JSON.stringify({ eventType, payload });

    const response = await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Message: message,
      })
    );

    console.log("[snsService] Publish succeeded", {
      eventType,
      topicArn: SNS_TOPIC_ARN,
      messageId: response?.MessageId,
    });

    return response;
  } catch (error) {
    console.error("[snsService] Publish failed", {
      eventType,
      topicArn: SNS_TOPIC_ARN,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

export { publishEvent };
