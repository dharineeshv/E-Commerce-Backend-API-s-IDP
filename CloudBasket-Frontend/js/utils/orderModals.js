import { state } from './orderData.js';
import { updateOrderStatus } from '../api/orderApi.js';

let currentOrder = null;

export function initModals() {
    // Overlays and Close Buttons
    const overlay = document.getElementById('orders-modal-overlay');
    if (overlay) overlay.addEventListener('click', closeAllModals);

    const closeViewBtn = document.getElementById('close-view-modal');
    if (closeViewBtn) closeViewBtn.addEventListener('click', closeViewModal);
    
    // Sub-modal Close
    const closeStatusBtn = document.getElementById('close-update-status-modal');
    if (closeStatusBtn) closeStatusBtn.addEventListener('click', () => {
        document.getElementById('update-status-modal').classList.remove('show');
    });
    
    const closeShipBtn = document.getElementById('close-assign-shipment-modal');
    if (closeShipBtn) closeShipBtn.addEventListener('click', () => {
        document.getElementById('assign-shipment-modal').classList.remove('show');
    });

    const closeCancelBtn = document.getElementById('close-cancel-order-modal');
    if (closeCancelBtn) closeCancelBtn.addEventListener('click', () => document.getElementById('cancel-order-modal').classList.remove('show'));
    
    const cancelAbortBtn = document.getElementById('cancel-abort-btn');
    if (cancelAbortBtn) cancelAbortBtn.addEventListener('click', () => document.getElementById('cancel-order-modal').classList.remove('show'));
    
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', confirmCancelOrder);


    // Quick Actions
    const btnUpdateStatus = document.getElementById('btn-update-status');
    if (btnUpdateStatus) btnUpdateStatus.addEventListener('click', openUpdateStatusModal);
    
    const btnDownloadInvoice = document.getElementById('btn-download-invoice');
    if (btnDownloadInvoice) btnDownloadInvoice.addEventListener('click', downloadInvoice);
    
    const btnCancelOrder = document.getElementById('btn-cancel-order');
    if (btnCancelOrder) btnCancelOrder.addEventListener('click', cancelOrder);
}

export function openViewModal(orderId) {
    currentOrder = state.allOrders.find(o => o.id === orderId);
    if (!currentOrder) return;

    // Populate Header
    document.getElementById('modal-order-number').textContent = `Order ${currentOrder.id}`;
    
    const badge = document.getElementById('modal-order-status');
    if (badge) {
        badge.textContent = currentOrder.status;
        badge.className = `badge badge-status ${currentOrder.status.toLowerCase()}`;
    }
    
    document.getElementById('modal-order-date').textContent = `Placed on ${currentOrder.date}`;

    // Populate Customer
    document.getElementById('modal-customer-avatar').textContent = currentOrder.customerAvatar;
    document.getElementById('modal-customer-name').textContent = currentOrder.customerName;
    document.getElementById('modal-customer-email').textContent = currentOrder.customerEmail;
    
    const shipping = currentOrder._raw.shippingAddress || {};
    const phone = shipping.phone || "+1 (555) 000-0000";
    const address = `${shipping.addressLine1 || 'Unknown Address'}<br>${shipping.city || ''} ${shipping.state || ''} ${shipping.postalCode || ''}<br>${shipping.country || 'Unknown Country'}`;

    document.getElementById('modal-customer-phone').textContent = phone;
    document.getElementById('modal-shipping-name').textContent = currentOrder.customerName;
    
    const shippingAddress = document.getElementById('modal-shipping-address');
    if (shippingAddress) {
        shippingAddress.innerHTML = address;
    }

    // Populate Items
    renderOrderItems(currentOrder);

    // Show Modal
    const overlay = document.getElementById('orders-modal-overlay');
    if (overlay) overlay.classList.add('show');
    
    const viewModal = document.getElementById('view-order-modal');
    if (viewModal) viewModal.classList.add('show');
}

function closeViewModal() {
    const viewModal = document.getElementById('view-order-modal');
    if (viewModal) viewModal.classList.remove('show');
    
    const overlay = document.getElementById('orders-modal-overlay');
    if (overlay) overlay.classList.remove('show');
    
    currentOrder = null;
}

function closeAllModals() {
    document.querySelectorAll('.order-modal, .sub-modal, .modal-overlay').forEach(el => {
        el.classList.remove('show');
    });
    currentOrder = null;
}

function renderOrderItems(order) {
    const tbody = document.getElementById('modal-items-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const items = order._raw.items || [];
    
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #64748b; padding: 20px;">No items in this order.</td></tr>`;
    } else {
        items.forEach(item => {
            const name = item.name || item.productId || 'Unknown Item';
            const sku = item.productId ? `SKU: ${item.productId}` : 'SKU: N/A';
            const qty = item.quantity || 1;
            const price = item.price || 0;
            const encodedName = encodeURIComponent(name);
            const imgUrl = `https://source.unsplash.com/150x150/?product,${encodedName}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${imgUrl}" alt="${name}" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=150&q=80'">
                        <div>
                            <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #0f172a;">${name}</h4>
                            <p style="margin: 0; font-size: 12px; color: #64748b;">${sku}</p>
                        </div>
                    </div>
                </td>
                <td style="text-align: right;">₹${Number(price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style="text-align: center;">${qty}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    const totalEl = document.getElementById('modal-order-total');
    if (totalEl) totalEl.textContent = '₹' + Number(order.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function openUpdateStatusModal() {
    document.getElementById('update-status-modal').classList.add('show');
}

export function handleUpdateStatus(callback) {
    const saveBtn = document.getElementById('save-status-btn');
    if (!saveBtn) return;
    
    saveBtn.addEventListener('click', async () => {
        const newStatus = document.getElementById('new-status-select').value;
        if (!newStatus || !currentOrder) return;
        
        try {
            await updateOrderStatus(currentOrder.id, newStatus);
            // In state, also update
            currentOrder.status = newStatus;
            
            showToast("Order status updated successfully!");
            document.getElementById('update-status-modal').classList.remove('show');
            closeViewModal();
            if (callback) callback();
        } catch (error) {
            showToast("Failed to update status.");
            console.error(error);
        }
    });
}

function cancelOrder() {
    document.getElementById('cancel-order-modal').classList.add('show');
}

function confirmCancelOrder() {
    document.getElementById('cancel-order-modal').classList.remove('show');
    const statusSelect = document.getElementById('new-status-select');
    if (statusSelect) statusSelect.value = 'Cancelled';
    
    const saveBtn = document.getElementById('save-status-btn');
    if (saveBtn) saveBtn.click();
}

export function handleAssignShipment() {
    const saveShipBtn = document.getElementById('save-shipment-btn');
    if (!saveShipBtn) return;
    
    saveShipBtn.addEventListener('click', () => {
        const dispatch = document.getElementById('ship-dispatch').value;
        const delivery = document.getElementById('ship-delivery').value;
        
        if (!dispatch || !delivery) {
            alert("Please select dispatch and expected delivery dates.");
            return;
        }

        document.getElementById('assign-shipment-modal').classList.remove('show');
        
        // Trigger status update to SHIPPED
        const statusSelect = document.getElementById('new-status-select');
        if (statusSelect) statusSelect.value = 'Shipped';
        
        const saveStatusBtn = document.getElementById('save-status-btn');
        if (saveStatusBtn) saveStatusBtn.click();
    });
}

function downloadInvoice() {
    showToast("Invoice download started.");
    
    // Simulate PDF download
    setTimeout(() => {
        showToast("Invoice PDF saved to device.");
    }, 1500);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        margin-top: 1rem;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        animation: fadeIn 0.3s, fadeOut 0.3s 2.7s forwards;
    `;
    toast.textContent = message;
    
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            #toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; }
            @keyframes fadeOut { to { opacity: 0; transform: translateY(10px); } }
        `;
        document.head.appendChild(style);
    }

    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}
