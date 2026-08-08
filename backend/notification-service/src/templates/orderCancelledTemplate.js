const orderCancelledTemplate = (payload) => {
  const subject = "Order Cancelled";

  const text = `
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

  return {
    subject,
    text,
  };
};

export { orderCancelledTemplate };