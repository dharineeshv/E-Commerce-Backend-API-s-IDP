import "../config/env.js";
import { reduceInventory, restoreInventory } from "../services/inventoryService.js";

const handleOrderPlaced = async ({ orderId, items }) => {
  if (!Array.isArray(items) || items.length === 0) {
    console.warn("[inventoryEventHandler] ORDER_PLACED missing items", { orderId });
    return;
  }

  for (const item of items) {
    try {
      await reduceInventory(item.productId, item.quantity);
      console.log("[inventoryEventHandler] Stock reduced", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
      });
    } catch (error) {
      console.error("[inventoryEventHandler] Failed to reduce stock", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        message: error.message,
      });
    }
  }
};

const handleOrderCancelled = async ({ orderId, items }) => {
  if (!Array.isArray(items) || items.length === 0) {
    console.warn("[inventoryEventHandler] ORDER_CANCELLED missing items", { orderId });
    return;
  }

  for (const item of items) {
    try {
      await restoreInventory(item.productId, item.quantity);
      console.log("[inventoryEventHandler] Stock restored", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
      });
    } catch (error) {
      console.error("[inventoryEventHandler] Failed to restore stock", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        message: error.message,
      });
    }
  }
};

const EVENT_HANDLERS = {
  ORDER_PLACED: handleOrderPlaced,
  ORDER_CANCELLED: handleOrderCancelled,
};

const handleInventoryEvent = async ({ eventType, payload }) => {
  const handler = EVENT_HANDLERS[eventType];

  if (!handler) {
    console.warn("[inventoryEventHandler] Unrecognised eventType — skipping", { eventType });
    return;
  }

  console.log("[inventoryEventHandler] Processing event", { eventType });
  await handler(payload);
};

export { handleInventoryEvent };
