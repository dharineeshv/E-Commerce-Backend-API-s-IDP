import "../config/env.js";
import { setOrderStatus } from "../services/orderService.js";

const PAYMENT_EVENT_STATUS_MAP = {
  PAYMENT_SUCCESS: "CONFIRMED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAYMENT_REFUNDED: "REFUNDED",
};

const handleOrderEvent = async ({ eventType, payload }) => {
  const targetStatus = PAYMENT_EVENT_STATUS_MAP[eventType];

  if (!targetStatus) {
    console.warn("[orderEventHandler] Unrecognised eventType — skipping", { eventType });
    return;
  }

  const { orderId, paymentId } = payload;

  if (!orderId) {
    console.warn("[orderEventHandler] Missing orderId in payload — skipping", { eventType, paymentId });
    return;
  }

  const updated = await setOrderStatus(orderId, targetStatus);
};

export { handleOrderEvent };
