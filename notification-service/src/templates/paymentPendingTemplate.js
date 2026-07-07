const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const paymentPendingTemplate = (payload) => {
  const subject = "Payment Pending";

  const text = `
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

  return {
    subject,
    text,
  };
};

export { paymentPendingTemplate };