import { handleNotificationEvent } from "./notificationEventHandler.js";

export const handleSqsEvent = async (event) => {
  console.log("========== Notification SQS Event ==========");

  for (const record of event.Records) {
    try {
      const snsEnvelope = JSON.parse(record.body);
      const businessEvent = JSON.parse(snsEnvelope.Message);

      console.log("Business Event:");
      console.log(JSON.stringify(businessEvent, null, 2));

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