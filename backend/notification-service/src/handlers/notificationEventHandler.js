import { sendEmail } from "../services/emailService.js";

import { orderPlacedTemplate } from "../templates/orderPlacedTemplate.js";
import { orderCancelledTemplate } from "../templates/orderCancelledTemplate.js";
import { paymentSuccessTemplate } from "../templates/paymentSuccessTemplate.js";
import { paymentPendingTemplate } from "../templates/paymentPendingTemplate.js";
import { paymentRefundedTemplate } from "../templates/paymentRefundedTemplate.js";

const templateMap = {
  ORDER_PLACED: orderPlacedTemplate,
  ORDER_CANCELLED: orderCancelledTemplate,
  PAYMENT_SUCCESS: paymentSuccessTemplate,
  PAYMENT_PENDING: paymentPendingTemplate,
  PAYMENT_REFUNDED: paymentRefundedTemplate,
};

export const handleNotificationEvent = async (event) => {
  try {
    const { eventType, payload } = event;

    const template = templateMap[eventType];

    if (!template) {
      console.warn(`No email template found for event: ${eventType}`);
      return;
    }

    const { subject, text } = template(payload);

    // Send email to customer
    if (payload.customerEmail) {
      await sendEmail({
        to: payload.customerEmail,
        subject,
        text,
      });
    } else {
      console.warn("Customer email not available.");
    }

    // Send copy to store owner
    if (process.env.STORE_OWNER_EMAIL) {
      await sendEmail({
        to: process.env.STORE_OWNER_EMAIL,
        subject: `[STORE COPY] ${subject}`,
        text,
      });
    }
  } catch (error) {
    console.error("Notification processing failed:", error);
    throw error;
  }
};