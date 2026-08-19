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
    
    // Wire up the inner sub-modal logic
    handleUpdateStatus(() => {
        // We need to re-render the table on status change
        // We'll dispatch a custom event or just let the caller refresh
        document.dispatchEvent(new Event('orders-updated'));
    });
    handleAssignShipment();
}

export function openViewModal(orderId) {
    currentOrder = state.allOrders.find(o => String(o.id) === String(orderId));
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
    let displayName = currentOrder.customerName;
    if (displayName && displayName.includes('@')) {
        displayName = displayName.split('@')[0].split('.')[0];
        // Capitalize first letter
        if (displayName) displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    }
    document.getElementById('modal-customer-name').textContent = displayName;
    document.getElementById('modal-customer-email').textContent = currentOrder.customerEmail;
    
    const shipping = currentOrder._raw.shippingAddress || {};
    let rawPhone = shipping.phone || shipping.phoneNumber || currentOrder._raw.customerPhone || currentOrder._raw.phone || shipping.mobile || "";
    if (rawPhone === "000-000-0000" || rawPhone === "+1 (555) 000-0000") {
        rawPhone = "";
    }

    const addressLine = shipping.address || shipping.addressLine1 || '';
    const city = shipping.city || '';
    const shipState = shipping.state || '';
    const zip = shipping.zipCode || shipping.postalCode || '';
    const country = shipping.country || 'India';
    
    const parts = [];
    if (addressLine) parts.push(addressLine);
    
    const line2 = `${city} ${shipState} ${zip}`.trim();
    if (line2) parts.push(line2);
    
    if (country) parts.push(country);
    
    const address = parts.join('<br>');

    const phoneEl = document.getElementById('modal-customer-phone');
    if (phoneEl) {
        if (rawPhone && rawPhone.trim()) {
            phoneEl.textContent = rawPhone.trim();
            phoneEl.style.display = "";
        } else {
            phoneEl.textContent = "";
            phoneEl.style.display = "none";
        }
    }

    document.getElementById('modal-shipping-name').textContent = displayName;
    
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

function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function renderOrderItems(order) {
    const tbody = document.getElementById('modal-items-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #64748b; padding: 20px;">Loading items...</td></tr>';
    
    const items = order._raw.items || [];
    
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #64748b; padding: 20px;">No items in this order.</td></tr>`;
        return;
    }

    let productCatalogMap = window._productCatalogMap || null;
    if (!productCatalogMap) {
        try {
            const { getAllProducts } = await import('../api/productApi.js');
            const res = await getAllProducts();
            const list = res ? (res.products || res.data || (Array.isArray(res) ? res : [])) : [];
            productCatalogMap = {};
            list.forEach(p => {
                const pId = p.productId || p.id || p.sku;
                if (pId) productCatalogMap[pId] = p;
            });
            window._productCatalogMap = productCatalogMap;
        } catch (e) {
            productCatalogMap = {};
        }
    }

    tbody.innerHTML = '';
    items.forEach(item => {
        const itemPid = item.productId || item.id || item.sku;
        const catalogItem = (productCatalogMap && itemPid) ? productCatalogMap[itemPid] : null;

        const rawName = item.name || item.productName || item.title;
        const isUuidName = !rawName || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawName);
        
        let name = rawName;
        if (isUuidName && catalogItem && (catalogItem.name || catalogItem.title)) {
            name = catalogItem.name || catalogItem.title;
        } else if (isUuidName && itemPid) {
            name = `Product (${itemPid.substring(0, 8)})`;
        }
        if (!name) name = 'Product Item';

        const sku = itemPid ? `SKU: ${itemPid}` : 'SKU: N/A';
        const qty = item.quantity || item.qty || 1;
        const price = item.price || item.unitPrice || catalogItem?.price || catalogItem?.mrp || 0;

        let rawImg = item.imageUrl || item.image || item.bannerImageUrl || catalogItem?.imageUrl || catalogItem?.image || catalogItem?.images?.[0] || catalogItem?.thumbnail;
        if (rawImg && rawImg.includes('amazonaws.com')) {
            try {
                const parsed = new URL(rawImg);
                rawImg = `https://cloudbasket-products-personal-dhari.s3.ap-southeast-1.amazonaws.com${parsed.pathname}`;
            } catch (e) {}
        }

        const fallbackImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80';
        const imgUrl = rawImg || fallbackImg;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${imgUrl}" alt="${escapeXml(name)}" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover; border: 1px solid #e2e8f0;" onerror="this.onerror=null; this.src='${fallbackImg}';">
                    <div>
                        <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${escapeXml(name)}</h4>
                        <p style="margin: 0; font-size: 12px; color: #64748b;">${escapeXml(sku)}</p>
                    </div>
                </div>
            </td>
            <td style="text-align: right; font-weight: 600;">₹${Number(price).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td style="text-align: center; font-weight: 600;">${qty}</td>
        `;
        tbody.appendChild(tr);
    });

    const totalEl = document.getElementById('modal-order-total');
    if (totalEl) totalEl.textContent = '₹' + Number(order.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function openUpdateStatusModal() {
    document.getElementById('update-status-modal').classList.add('show');
}

export function handleUpdateStatus(callback) {
    const saveBtn = document.getElementById('save-status-btn');
    if (!saveBtn) return;
    
    saveBtn.addEventListener('click', async () => {
        const newStatus = document.getElementById('new-status-select').value;
        const targetOrder = currentOrder;
        if (!newStatus || !targetOrder) return;
        
        try {
            const apiStatus = newStatus.toUpperCase();
            const res = await updateOrderStatus(targetOrder.id, apiStatus);
            if (!res) throw new Error("API returned null");
            
            // In state, also update
            if (currentOrder && currentOrder.id === targetOrder.id) currentOrder.status = newStatus;
            targetOrder.status = newStatus;
            
            showToast("Order status updated successfully!");
            document.getElementById('update-status-modal').classList.remove('show');
            closeViewModal();
            if (callback) callback();
        } catch (error) {
            console.warn("Backend update failed (CORS/API error). Mocking update locally.", error);
            if (currentOrder && currentOrder.id === targetOrder.id) currentOrder.status = newStatus;
            targetOrder.status = newStatus;
            
            const mockedStatuses = JSON.parse(localStorage.getItem('mockedOrderStatuses') || '{}');
            mockedStatuses[targetOrder.id] = newStatus;
            localStorage.setItem('mockedOrderStatuses', JSON.stringify(mockedStatuses));
            
            showToast("Order status updated (Mocked).");
            document.getElementById('update-status-modal').classList.remove('show');
            closeViewModal();
            document.dispatchEvent(new Event('local-orders-updated'));
        }
    });
}

function cancelOrder() {
    document.getElementById('cancel-order-modal').classList.add('show');
}

async function confirmCancelOrder() {
    document.getElementById('cancel-order-modal').classList.remove('show');
    
    if (!currentOrder) return;
    
    try {
        const res = await updateOrderStatus(currentOrder.id, 'Cancelled');
        if (!res) throw new Error("API returned null");
        
        // In state, also update
        currentOrder.status = 'Cancelled';
        
        showToast("Order cancelled successfully!");
        closeViewModal();
        document.dispatchEvent(new Event('orders-updated'));
    } catch (error) {
        console.warn("Backend update failed (CORS/API error). Mocking update locally.", error);
        currentOrder.status = 'Cancelled';
        
        const mockedStatuses = JSON.parse(localStorage.getItem('mockedOrderStatuses') || '{}');
        mockedStatuses[currentOrder.id] = 'Cancelled';
        localStorage.setItem('mockedOrderStatuses', JSON.stringify(mockedStatuses));
        
        showToast("Order cancelled (Mocked).");
        closeViewModal();
        document.dispatchEvent(new Event('local-orders-updated'));
    }
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
    if (!currentOrder) return;
    
    showToast("Preparing invoice for printing...");
    
    const container = document.getElementById('invoice-print-container');
    if (!container) return;
    
    const itemsHtml = (currentOrder.items || []).map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name || item.productId || 'Unknown Item'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity || 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${Number(item.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
        </tr>
    `).join('');
    
    container.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; color: #1e293b; padding: 40px; background: #fff;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 32px;">
                <div>
                    <h1 style="margin: 0; color: #0f172a; font-size: 32px; font-weight: 800;">INVOICE</h1>
                    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 15px;">Invoice # INV-${currentOrder.id.substring(0,8).toUpperCase()}</p>
                    <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Date: &nbsp; ${currentOrder.date}</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="margin: 0; color: #3b82f6; font-size: 28px; font-weight: 800;">CloudBasket</h2>
                    <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">123 Cloud Avenue, Tech Park</p>
                    <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">support@cloudbasket.com</p>
                </div>
            </div>
            
            <!-- Details Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
                <!-- Billed To -->
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9;">
                    <h3 style="margin: 0 0 12px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 700;">Billed To</h3>
                    <p style="margin: 0 0 4px 0; font-weight: 700; color: #0f172a; font-size: 16px;">${currentOrder.customerName || currentOrder.customerEmail.split('@')[0]}</p>
                    <p style="margin: 0; color: #64748b; font-size: 14px;">Email: &nbsp; ${currentOrder.customerEmail}</p>
                    ${currentOrder._raw && currentOrder._raw.shippingAddress ? `<p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">${currentOrder._raw.shippingAddress.addressLine1 || currentOrder._raw.shippingAddress.street || ''}, &nbsp; ${currentOrder._raw.shippingAddress.city || ''}</p>` : ''}
                </div>
                
                <!-- Order Info -->
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9;">
                    <h3 style="margin: 0 0 12px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 700;">Order Status</h3>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #64748b; font-size: 14px;">Delivery Status: &nbsp; </span>
                        <span style="font-weight: 600; color: ${currentOrder.status === 'Delivered' ? '#10b981' : '#3b82f6'};">${currentOrder.status}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #64748b; font-size: 14px;">Payment Status: &nbsp; </span>
                        <span style="font-weight: 600; color: ${currentOrder.paymentStatus === 'Paid' ? '#10b981' : (currentOrder.paymentStatus === 'Failed' ? '#ef4444' : '#f59e0b')};">${currentOrder.paymentStatus || 'Success'}</span>
                    </div>
                </div>
            </div>
            
            <!-- Items Table -->
            <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 32px; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">
                <thead>
                    <tr style="background-color: #f8fafc;">
                        <th style="padding: 16px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600; font-size: 14px;">Item Description</th>
                        <th style="padding: 16px; text-align: center; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600; font-size: 14px; width: 100px;">Qty</th>
                        <th style="padding: 16px; text-align: right; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600; font-size: 14px; width: 150px;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div style="display: flex; justify-content: flex-end;">
                <div style="width: 300px; background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #f1f5f9;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #475569; font-size: 16px; font-weight: 600;">Total Amount: &nbsp; </span>
                        <span style="font-weight: 800; font-size: 24px; color: #0f172a;">₹${Number(currentOrder.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 60px; text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 32px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">Thank you for shopping with CloudBasket!</p>
                <p style="margin: 0;">If you have any questions about this invoice, please contact support@cloudbasket.com</p>
            </div>
        </div>
    `;
    // Give DOM a moment to update
    setTimeout(() => {
        const element = container.firstElementChild;
        const opt = {
            margin:       0,
            filename:     `Invoice-${currentOrder.id.substring(0,8).toUpperCase()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        if (window.html2pdf) {
            html2pdf().set(opt).from(element).save().then(() => {
                showToast("Invoice downloaded successfully as PDF.");
            });
        } else {
            console.warn("html2pdf library not loaded, falling back to window.print()");
            window.print();
            showToast("Invoice printed (fallback).");
        }
    }, 200);
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
