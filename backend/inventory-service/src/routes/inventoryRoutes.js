import express from "express";
import * as inventoryController from "../controllers/inventoryController.js";

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ message: 'Inventory Service Working', status: 'healthy', timestamp: new Date().toISOString() });
});

// Fixed: specific routes defined BEFORE /:productId to avoid Express swallowing them
router.get('/low-stock', inventoryController.getLowStock);
router.get('/check/:productId', inventoryController.checkInventory);
router.put('/reduce/:productId', inventoryController.reduceInventory);
router.put('/restore/:productId', inventoryController.restoreInventory);

router.post('/', inventoryController.createInventory);
router.get('/', inventoryController.getInventory);
router.get('/:productId', inventoryController.getInventoryByProductId);
router.put('/:productId', inventoryController.updateInventory);
router.delete('/:productId', inventoryController.deleteInventory);

export default router;
