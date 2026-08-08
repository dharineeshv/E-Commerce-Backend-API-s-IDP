import { 
  processPayment, 
  getAllPayments, 
  getPaymentById, 
  getPaymentByOrderId, 
  updatePaymentStatus, 
  refundPayment 
} from "./src/controllers/paymentController.js";

async function runTests() {
  console.log("=== Testing All Payment APIs Locally ===\n");

  const createMockRes = (name) => ({
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      console.log(`[${name}] Status: ${this.statusCode}`);
      if (this.statusCode >= 400) {
        console.error(`[${name}] Response:`, data);
      } else {
        console.log(`[${name}] Success!`);
      }
      return this;
    }
  });

  // 1. Process Payment (Mock Customer)
  console.log("1. Testing processPayment (Create Payment)...");
  const mockProcessReq = {
    user: { sub: "test-customer-sub" },
    body: {
      orderId: "test-order-123",
      paymentMethod: "Razorpay",
      amount: 50000,
      transactionId: "pay_test123"
    }
  };
  // Wait, processPayment calls getCustomerIdFromSub which does an axios HTTP request to user-profile-service!
  // If user-profile-service is not running, it will fail!
  // So we should expect a 500 or network error if the profile service is not reachable, but let's test it.
  
  try {
    await processPayment(mockProcessReq, createMockRes("processPayment"));
  } catch (err) {
    console.error("processPayment threw an error:", err.message);
  }

  // 2. Get All Payments (Admin)
  console.log("\n2. Testing getAllPayments...");
  const mockGetAllReq = {
    user: { sub: "test-admin-sub" }
  };
  try {
    await getAllPayments(mockGetAllReq, createMockRes("getAllPayments"));
  } catch (err) {
    console.error("getAllPayments threw an error:", err.message);
  }

  // 3. Get Payment By Order ID
  console.log("\n3. Testing getPaymentByOrderId...");
  const mockGetByOrderReq = {
    user: { sub: "test-customer-sub" },
    params: { orderId: "test-order-123" }
  };
  try {
    await getPaymentByOrderId(mockGetByOrderReq, createMockRes("getPaymentByOrderId"));
  } catch (err) {
    console.error("getPaymentByOrderId threw an error:", err.message);
  }

  // 4. Update Payment Status (Admin)
  console.log("\n4. Testing updatePaymentStatus...");
  const mockUpdateReq = {
    user: { sub: "test-admin-sub" },
    params: { paymentId: "test-payment-id" },
    body: { status: "COMPLETED" }
  };
  try {
    await updatePaymentStatus(mockUpdateReq, createMockRes("updatePaymentStatus"));
  } catch (err) {
    console.error("updatePaymentStatus threw an error:", err.message);
  }
}

runTests();
