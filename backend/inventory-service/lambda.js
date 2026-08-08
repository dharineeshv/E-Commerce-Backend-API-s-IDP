import "./src/config/env.js";
import serverless from "serverless-http";
import app from "./src/app.js";
import { handleInventoryEvent } from "./src/handlers/inventoryEventHandler.js";

const apiGatewayHandler = serverless(app);

export const handler = async (event, context) => {
  if (Array.isArray(event.Records)) {
    for (const record of event.Records) {
      try {
        const snsEnvelope = JSON.parse(record.body);
        const businessEvent = JSON.parse(snsEnvelope.Message);
        await handleInventoryEvent(businessEvent);
      } catch (error) {
        console.error("[lambda] Failed to process SQS record", {
          messageId: record.messageId,
          message: error.message,
          stack: error.stack,
        });
      }
    }

    return;
  }

  return apiGatewayHandler(event, context);
};
