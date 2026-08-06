import { createOrder, verifyPayment } from "./src/controllers/razorpayController.js";

async function runTests() {
  console.log("=== Testing Razorpay APIs Locally ===");

  let generatedOrderId = "";

  // 1. Test createOrder
  console.log("\n1. Testing createOrder...");
  const mockCreateReq = {
    body: {
      amount: 50000, // 500 INR
      currency: "INR",
      receipt: "test-receipt-1"
    }
  };

  const mockCreateRes = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      console.log(`[createOrder] Status: ${this.statusCode}`);
      if (data.success) {
        console.log(`[createOrder] Success! Razorpay Order ID: ${data.data.id}`);
        generatedOrderId = data.data.id;
      } else {
        console.log(`[createOrder] Failed:`, data);
      }
      return this;
    }
  };

  await createOrder(mockCreateReq, mockCreateRes);

  if (!generatedOrderId) {
    console.error("Stopping tests because createOrder failed.");
    return;
  }

  // 2. Test verifyPayment with Invalid Signature
  console.log("\n2. Testing verifyPayment (Invalid Signature)...");
  const mockVerifyReq = {
    user: { sub: "test-sub" },
    body: {
      razorpay_order_id: generatedOrderId,
      razorpay_payment_id: "pay_dummy123",
      razorpay_signature: "invalid_signature",
      orderId: "ord_123",
      amount: 50000
    }
  };

  const mockVerifyRes = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      console.log(`[verifyPayment - Invalid] Status: ${this.statusCode}`);
      console.log(`[verifyPayment - Invalid] Response:`, data);
      return this;
    }
  };

  await verifyPayment(mockVerifyReq, mockVerifyRes);
  
  console.log("\n✅ Local API logic tests completed successfully.");
}

runTests();
