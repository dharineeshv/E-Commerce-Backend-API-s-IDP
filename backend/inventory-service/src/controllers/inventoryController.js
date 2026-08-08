import * as inventoryService from "../services/inventoryService.js";

async function createInventory(req, res) {
  try {
    const { productId, quantity, location } = req.body;
    const item = await inventoryService.createInventoryItem({ productId, quantity, location });
    res.status(201).json(item);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function getInventory(req, res) {
  try {
    const items = await inventoryService.getAllInventoryItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getInventoryByProductId(req, res) {
  try {
    const { productId } = req.params;
    const item = await inventoryService.getInventoryItemByProductId(productId);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function updateInventory(req, res) {
  try {
    const { productId } = req.params;
    const updates = req.body;
    const updatedItem = await inventoryService.updateInventoryItem(productId, updates);
    res.json(updatedItem);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function deleteInventory(req, res) {
  try {
    const { productId } = req.params;
    const deletedItem = await inventoryService.deleteInventoryItem(productId);
    res.json({ message: 'Inventory item deleted', item: deletedItem });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function checkInventory(req, res) {
  try {
    const { productId } = req.params;
    const status = await inventoryService.checkInventory(productId);
    res.json(status);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function reduceInventory(req, res) {
  try {
    const { productId } = req.params;
    const { amount } = req.body;
    const updatedItem = await inventoryService.reduceInventory(productId, amount);
    res.json(updatedItem);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function restoreInventory(req, res) {
  try {
    const { productId } = req.params;
    const { amount } = req.body;
    const updatedItem = await inventoryService.restoreInventory(productId, amount);
    res.json(updatedItem);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function getLowStock(req, res) {
  try {
    const threshold = req.query.threshold ? Number(req.query.threshold) : 10;
    const items = await inventoryService.getLowStockItems(threshold);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export {
  createInventory,
  getInventory,
  getInventoryByProductId,
  updateInventory,
  deleteInventory,
  checkInventory,
  reduceInventory,
  restoreInventory,
  getLowStock,
};
