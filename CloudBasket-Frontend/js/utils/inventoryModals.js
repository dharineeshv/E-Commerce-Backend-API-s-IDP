import { getInventoryById, updateInventory } from "../api/inventoryApi.js";

let currentInventoryData = [];
let onRefreshCallback = null;

export function setupModals(inventoryData, refreshCallback) {
    currentInventoryData = inventoryData;
    onRefreshCallback = refreshCallback;

    // View Modal
    const viewModal = document.getElementById("inventory-view-modal");
    const closeView = document.getElementById("close-view-modal");
    if (closeView) closeView.addEventListener("click", () => viewModal.classList.remove("show"));

    // Action Modal
    const actionModal = document.getElementById("inventory-action-modal");
    const closeAction = document.getElementById("close-action-modal");
    const cancelAction = document.getElementById("cancel-action");
    if (closeAction) closeAction.addEventListener("click", () => actionModal.classList.remove("show"));
    if (cancelAction) cancelAction.addEventListener("click", () => actionModal.classList.remove("show"));

    // Form Submit
    const form = document.getElementById("stock-action-form");
    if (form) {
        form.addEventListener("submit", handleActionSubmit);
    }

    // Attach delegated events to the table body for the action buttons
    const tableBody = document.getElementById("inventory-table-body");
    if (tableBody) {
        tableBody.addEventListener("click", handleTableClick);
    }
}

async function handleTableClick(event) {
    const btn = event.target.closest(".btn-action");
    if (!btn) return;

    const inventoryId = btn.dataset.id;
    if (!inventoryId) return;

    if (btn.classList.contains("view-btn")) {
        await openViewModal(inventoryId);
    } else if (btn.classList.contains("stock-in-btn")) {
        openActionModal(inventoryId, "IN");
    } else if (btn.classList.contains("stock-out-btn")) {
        openActionModal(inventoryId, "OUT");
    } else if (btn.classList.contains("adjust-btn")) {
        openActionModal(inventoryId, "ADJUST");
    }
}

async function openViewModal(inventoryId) {
    const modal = document.getElementById("inventory-view-modal");
    const body = document.getElementById("view-modal-body");
    
    body.innerHTML = `<div style="text-align: center; padding: 2rem;"><div class="spinner"></div><p>Loading details...</p></div>`;
    modal.classList.add("show");

    const data = await getInventoryById(inventoryId);
    if (!data || !data.success) {
        body.innerHTML = `<div style="color: red; text-align: center;">Failed to load inventory details.</div>`;
        return;
    }

    const item = data.data;
    // We try to find the combined product info from our current list to show image/name
    const cached = currentInventoryData.find(i => i.inventoryId === inventoryId) || {};
    const product = cached.product || {};
    const name = product.name || item.productId;
    const img = product.imageUrl || "https://placehold.co/60x60/f1f5f9/94a3b8?text=Img";

    body.innerHTML = `
        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
            <img src="${img}" alt="${name}" style="width: 60px; height: 60px; border-radius: 12px; object-fit: cover;">
            <div>
                <h3 style="margin: 0; font-size: 1.1rem; color: var(--inv-text-primary);">${name}</h3>
                <span style="color: var(--inv-text-secondary); font-size: 0.875rem;">SKU: ${item.sku || product.sku}</span>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Warehouse</label><div class="input-readonly">${item.location || item.warehouse || "N/A"}</div></div>
            <div class="form-group"><label>Status</label><div class="input-readonly">${item.status || "N/A"}</div></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Available</label><div class="input-readonly">${item.quantityAvailable || item.availableQuantity || item.quantity || 0}</div></div>
            <div class="form-group"><label>Reserved</label><div class="input-readonly">${item.quantityReserved || item.reservedQuantity || 0}</div></div>
            <div class="form-group"><label>Threshold</label><div class="input-readonly">${item.lowStockThreshold || item.threshold || 0}</div></div>
        </div>
        <div class="form-group"><label>Last Updated</label><div class="input-readonly">${new Date(item.updatedAt || item.lastUpdated).toLocaleString()}</div></div>
    `;
}

function openActionModal(inventoryId, type) {
    const modal = document.getElementById("inventory-action-modal");
    const title = document.getElementById("action-modal-title");
    const label = document.getElementById("action-qty-label");
    
    document.getElementById("action-inventory-id").value = inventoryId;
    document.getElementById("action-type").value = type;
    document.getElementById("action-input-qty").value = "";
    document.getElementById("action-remarks").value = "";

    const cached = currentInventoryData.find(i => i.inventoryId === inventoryId) || {};
    const product = cached.product || {};
    
    document.getElementById("action-product-name").value = product.name || inventoryId;
    document.getElementById("action-current-qty").value = cached.availableQuantity || cached.quantity || 0;

    if (type === "IN") {
        title.textContent = "Stock In";
        label.textContent = "Quantity to Add";
    } else if (type === "OUT") {
        title.textContent = "Stock Out";
        label.textContent = "Quantity to Remove";
    } else {
        title.textContent = "Stock Adjustment";
        label.textContent = "New Total Quantity";
    }

    modal.classList.add("show");
}

async function handleActionSubmit(e) {
    e.preventDefault();
    
    const inventoryId = document.getElementById("action-inventory-id").value;
    const type = document.getElementById("action-type").value;
    const qty = parseInt(document.getElementById("action-input-qty").value, 10);
    const remarks = document.getElementById("action-remarks").value;

    const btn = document.getElementById("confirm-action-btn");
    const originalText = btn.textContent;
    btn.textContent = "Processing...";
    btn.disabled = true;

    // Prepare payload based on the backend API schema.
    // Usually stock actions are sent as deltas or direct updates.
    // We'll mimic sending an update payload.
    const payload = {
        action: type,
        quantity: qty,
        remarks: remarks
    };

    const response = await updateInventory(inventoryId, payload);
    
    btn.textContent = originalText;
    btn.disabled = false;

    if (response && response.success !== false) {
        document.getElementById("inventory-action-modal").classList.remove("show");
        showToast(`Stock ${type.toLowerCase()} successful!`, "success");
        if (onRefreshCallback) onRefreshCallback();
    } else {
        showToast(response?.message || "Failed to update stock.", "error");
    }
}

export function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
