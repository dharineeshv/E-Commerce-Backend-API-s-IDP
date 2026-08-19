import { getInventoryById, updateInventory } from "../api/inventoryApi.js";
import { updateProductApi } from "../api/productApi.js";

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
    
    // Find cached combined product & inventory info
    const cached = currentInventoryData.find(i => i.inventoryId === inventoryId || i.productId === inventoryId) || {};
    let item = cached;

    // Only attempt API fetch if cached data does NOT contain product information
    if (!cached.product && !cached.name) {
        body.innerHTML = `<div style="text-align: center; padding: 2rem;"><div class="spinner"></div><p>Loading details...</p></div>`;
        modal.classList.add("show");

        const data = await getInventoryById(inventoryId);
        if (data && !data.notFound && !data.message && !data.error) {
            item = data.data || data;
        }
    } else {
        modal.classList.add("show");
    }
    
    const product = item.product || cached.product || {};
    const name = product.name || item.name || item.productName || item.productId || 'Inventory Product';
    
    let img = product.imageUrl || product.image || item.imageUrl || item.image;
    if (img && img.includes('amazonaws.com')) {
        try {
            const parsed = new URL(img);
            img = `https://cloudbasket-products-personal-dhari.s3.ap-southeast-1.amazonaws.com${parsed.pathname}`;
        } catch (e) {}
    }
    let fallbackImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
    if (name.toLowerCase().includes('vivo')) {
        fallbackImg = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80';
    }
    if (!img || img.includes('placeholder')) {
        img = fallbackImg;
    }

    const sku = item.sku || product.sku || cached.sku || 'N/A';
    const location = item.location || item.warehouseLocation || item.warehouse || cached.location || 'Main Warehouse';
    const status = item.status || product.status || cached.status || 'ACTIVE';
    const avail = item.availableQuantity !== undefined ? item.availableQuantity : (item.quantity !== undefined ? item.quantity : (cached.availableQuantity || 0));
    const resv = item.reservedQuantity !== undefined ? item.reservedQuantity : (cached.reservedQuantity || 0);
    const threshold = item.lowStockThreshold !== undefined ? item.lowStockThreshold : (cached.lowStockThreshold || 10);
    const updated = item.updatedAt || item.lastUpdated || cached.lastUpdated;
    const dateFormatted = updated ? new Date(updated).toLocaleString() : 'Recently';

    body.innerHTML = `
        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
            <img src="${img}" alt="${name}" onerror="this.onerror=null; this.src='${fallbackImg}';" style="width: 60px; height: 60px; border-radius: 12px; object-fit: cover;">
            <div>
                <h3 style="margin: 0; font-size: 1.1rem; color: var(--inv-text-primary);">${name}</h3>
                <span style="color: var(--inv-text-secondary); font-size: 0.875rem;">SKU: ${sku}</span>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Warehouse</label><div class="input-readonly">${location}</div></div>
            <div class="form-group"><label>Status</label><div class="input-readonly">${status}</div></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Available</label><div class="input-readonly">${avail}</div></div>
            <div class="form-group"><label>Reserved</label><div class="input-readonly">${resv}</div></div>
            <div class="form-group"><label>Threshold</label><div class="input-readonly">${threshold}</div></div>
        </div>
        <div class="form-group"><label>Last Updated</label><div class="input-readonly">${dateFormatted}</div></div>
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

    if (isNaN(qty) || qty < 0) {
        showToast("Please enter a valid quantity.", "error");
        return;
    }

    const btn = document.getElementById("confirm-action-btn");
    const originalText = btn.textContent;
    btn.textContent = "Processing...";
    btn.disabled = true;

    // Find cached product & inventory info
    const cached = currentInventoryData.find(i => i.inventoryId === inventoryId || i.productId === inventoryId) || {};
    const pId = cached.productId || inventoryId;
    const productObj = cached.product || {};
    
    let currentQty = cached.availableQuantity !== undefined 
        ? Number(cached.availableQuantity) 
        : (cached.quantity !== undefined 
            ? Number(cached.quantity) 
            : Number(productObj.quantity || 0));

    let newQty = currentQty;
    
    if (type === "IN") {
        newQty += qty;
    } else if (type === "OUT") {
        newQty -= qty;
        if (newQty < 0) newQty = 0;
    } else if (type === "ADJUST") {
        newQty = qty;
    }

    const payload = {
        quantity: newQty,
        remarks: remarks
    };

    let isSuccess = false;
    let errorMsg = "";

    // 1. Try updating inventory service
    try {
        const invRes = await updateInventory(inventoryId, payload);
        if (invRes && invRes.success !== false) {
            isSuccess = true;
        } else if (invRes && invRes.message) {
            errorMsg = invRes.message;
        }
    } catch (err) {
        console.warn("Inventory API update notice:", err);
    }

    // 2. Also update product quantity in Product Service if productId exists
    if (pId) {
        try {
            const prodRes = await updateProductApi(pId, {
                ...productObj,
                quantity: newQty
            });
            if (prodRes && (prodRes.success || prodRes.productId || prodRes.id)) {
                isSuccess = true;
            }
        } catch (err) {
            console.warn("Product API update notice:", err);
        }
    }

    btn.textContent = originalText;
    btn.disabled = false;

    if (isSuccess) {
        // Update cached values immediately for instant UI feedback
        cached.quantity = newQty;
        cached.availableQuantity = newQty;
        if (cached.product) {
            cached.product.quantity = newQty;
        }

        document.getElementById("inventory-action-modal").classList.remove("show");
        showToast(`Stock ${type.toLowerCase() === 'in' ? 'addition' : (type.toLowerCase() === 'out' ? 'removal' : 'adjustment')} successful!`, "success");
        
        if (onRefreshCallback) {
            await onRefreshCallback();
        }
    } else {
        showToast(errorMsg || "Failed to update stock.", "error");
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
