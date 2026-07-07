import serverless from "serverless-http";
import app from "./src/app.js";
import { handleSqsEvent } from "./src/handlers/sqsHandler.js";

export const handler = async (event, context) => {
  if (event?.Records?.some((record) => record.eventSource === "aws:sqs")) {
    return handleSqsEvent(event);
  }

  const handler = serverless(app);
  return handler(event, context);
};
