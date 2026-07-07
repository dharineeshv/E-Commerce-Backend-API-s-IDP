const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const orderPlacedTemplate = (payload) => {
  const subject = "Order Placed Successfully";

  const text = `
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

  return {
    subject,
    text,
  };
};

export { orderPlacedTemplate };