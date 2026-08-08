const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const paymentRefundedTemplate = (payload) => {
  const subject = "Payment Refunded";

  const text = `
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

  return {
    subject,
    text,
  };
};

export { paymentRefundedTemplate };