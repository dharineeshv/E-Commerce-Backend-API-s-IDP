import "./src/config/env.js";
import serverless from "serverless-http";
import app from "./src/app.js";

const apiGatewayHandler = serverless(app);

const isApiGatewayEvent = (event) => {
	return Boolean(
		event &&
			(event.requestContext?.http ||
				event.requestContext?.eventType ||
				event.httpMethod)
	);
};

const processSqsRecord = async (record) => {
	const rawBody = record?.body;

	console.log("Processing SQS record", {
		messageId: record?.messageId,
		body: rawBody,
	});

	if (!rawBody) {
		console.warn("Skipping SQS record with empty body", {
			messageId: record?.messageId,
		});
		return;
	}

	const snsEnvelope = JSON.parse(rawBody);
	const message = snsEnvelope?.Message;

	if (!message) {
		console.warn("Skipping SNS envelope without Message field", {
			messageId: record?.messageId,
			snsEnvelope,
		});
		return;
	}

	const parsedEvent = typeof message === "string" ? JSON.parse(message) : message;

	console.log("Parsed SNS event from SQS record", {
		eventType: parsedEvent?.eventType,
		orderId: parsedEvent?.orderId,
		fullEvent: parsedEvent,
	});
};

export const handler = async (event, context) => {
	try {
		if (isApiGatewayEvent(event)) {
			return await apiGatewayHandler(event, context);
		}

		if (Array.isArray(event?.Records) && event.Records.length > 0) {
			console.log("Inventory Lambda invoked by SQS", {
				recordCount: event.Records.length,
			});

			for (const record of event.Records) {
				await processSqsRecord(record);
			}

			return {
				statusCode: 200,
				body: JSON.stringify({
					success: true,
					message: "SQS records processed successfully",
					recordCount: event.Records.length,
				}),
			};
		}

		console.warn("Inventory Lambda received an unsupported event shape", {
			keys: Object.keys(event || {}),
		});

		return {
			statusCode: 400,
			body: JSON.stringify({
				success: false,
				message: "Unsupported event source",
			}),
		};
	} catch (error) {
		console.error("Inventory Lambda handler failed", {
			message: error.message,
			stack: error.stack,
		});

		throw error;
	}
};