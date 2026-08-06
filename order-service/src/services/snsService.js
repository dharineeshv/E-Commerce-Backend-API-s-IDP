import "../config/env.js";
import { PublishCommand } from "@aws-sdk/client-sns";
import { snsClient } from "../config/sns.js";

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

const formatCurrency = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

const formatMessage = (eventType, payload) => {
  switch (eventType) {

    case "ORDER_PLACED":
      return `
====================================================
            E-Commerce Notification
====================================================

Hello Customer,

Your order has been placed successfully.

Order ID       : ${payload.orderId}
Customer ID    : ${payload.customerId}
Status         : ${payload.orderStatus}
Total Amount   : ${formatCurrency(payload.totalAmount)}

Products
----------------------------------------------------
${payload.products
  .map(
    (item, index) => `
${index + 1}. ${item.productName}
   Quantity : ${item.quantity}
   Price    : ${formatCurrency(item.price)}
`
  )
  .join("")}

----------------------------------------------------

Order Date
${payload.createdAt}

Thank you for shopping with us.

====================================================
`;

    case "ORDER_CANCELLED":
      return `
====================================================
          Order Cancellation Notice
====================================================

Hello Customer,

Your order has been cancelled successfully.

Order ID : ${payload.orderId}

Cancelled At
${payload.cancelledAt}

====================================================
`;

    case "PAYMENT_SUCCESS":
      return `
====================================================
          Payment Confirmation
====================================================

Hello Customer,

Your payment was successful.

Payment ID     : ${payload.paymentId}
Order ID       : ${payload.orderId}
Amount         : ${formatCurrency(payload.amount)}
Method         : ${payload.paymentMethod}
Status         : ${payload.status}

Payment Date
${payload.paymentDate}

Thank you for shopping with us.

====================================================
`;

    case "PAYMENT_PENDING":
      return `
====================================================
          Payment Pending
====================================================

Hello Customer,

Your order has been placed.

Payment Method : Cash On Delivery

Amount : ${formatCurrency(payload.amount)}

Please pay during delivery.

====================================================
`;

    case "PAYMENT_REFUNDED":
      return `
====================================================
          Payment Refunded
====================================================

Hello Customer,

Your refund has been processed.

Payment ID : ${payload.paymentId}
Order ID   : ${payload.orderId}

Refund Amount : ${formatCurrency(payload.amount)}

====================================================
`;

    default:
      return JSON.stringify(payload, null, 2);
  }
};

const publishEvent = async (eventType, payload) => {
  try {

    const command = new PublishCommand({
  TopicArn: SNS_TOPIC_ARN,
  Subject: eventType.replace(/_/g, " "),
  Message: JSON.stringify({
    eventType,
    payload,
  }),
});

    const response = await snsClient.send(command);
    return response;

  } catch (error) {

    console.error("[SNS] Publish Failed", error);

    throw error;
  }
};

export { publishEvent };