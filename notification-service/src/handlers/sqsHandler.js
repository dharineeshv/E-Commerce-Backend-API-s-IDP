import { handleNotificationEvent } from "./notificationEventHandler.js";

export const handleSqsEvent = async (event) => {
  for (const record of event.Records) {
    try {
      const snsEnvelope = JSON.parse(record.body);
      const businessEvent = JSON.parse(snsEnvelope.Message);
      await handleNotificationEvent(businessEvent);
    } catch (error) {
      console.error("Failed to process SQS message:", error);
    }
  }

  return {
    statusCode: 200,
    body: "Notification events processed successfully.",
  };
};