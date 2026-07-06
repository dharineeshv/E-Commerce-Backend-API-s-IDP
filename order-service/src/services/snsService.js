import "../config/env.js";
import { PublishCommand } from "@aws-sdk/client-sns";
import { snsClient } from "../config/sns.js";

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

const publishEvent = async (eventType, payload) => {
  try {
    const message = JSON.stringify({
      eventType,
      payload,
      timestamp: new Date().toISOString(),
    });

    const command = new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: message,
    });

    const response = await snsClient.send(command);

    console.log("SNS event published successfully", {
      eventType,
      messageId: response.MessageId,
      topicArn: SNS_TOPIC_ARN,
    });

    return response;
  } catch (error) {
    console.error("Failed to publish SNS event", {
      eventType,
      topicArn: SNS_TOPIC_ARN,
      message: error.message,
      stack: error.stack,
    });

    throw new Error(`Failed to publish SNS event: ${error.message}`);
  }
};

export { publishEvent };