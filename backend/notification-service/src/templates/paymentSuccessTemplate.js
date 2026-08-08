const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const paymentSuccessTemplate = (payload) => {
  const subject = "Payment Successful";

  const text = `
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

  return {
    subject,
    text,
  };
};

export { paymentSuccessTemplate };