import { API } from "./config.js";
import { apiFetch } from "./api/apiClient.js";

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        document.getElementById('breadcrumb-order-id').textContent = "Order History > Unknown Order";
        document.getElementById('order-items-list').innerHTML = `<div style="padding: 20px; text-align: center; color: #ef4444;">No order ID provided.</div>`;
        return;
    }

    try {
        const response = await apiFetch(`${API.orderService}/api/v1/order`);
        if (!response.ok) throw new Error("Failed to fetch orders");

        const result = await response.json();
        const orders = result.data || result || [];
        
        const order = orders.find(o => (o.orderId === orderId || o.id === orderId));

        if (!order) {
            document.getElementById('breadcrumb-order-id').textContent = "Order History > Order Not Found";
            document.getElementById('order-items-list').innerHTML = `<div style="padding: 20px; text-align: center; color: #ef4444;">Order not found.</div>`;
            return;
        }

        // Fetch products to map UUIDs to actual names and S3 images
        let allProducts = [];
        try {
            const prodRes = await fetch('https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/products');
            if (prodRes.ok) {
                const pData = await prodRes.json();
                allProducts = pData.products || pData.data || pData || [];
                if (!Array.isArray(allProducts)) allProducts = [];
            }
        } catch (e) {
            console.error("Failed to fetch products for mapping", e);
        }

        renderOrderDetails(order, allProducts);

    } catch (error) {
        console.error("Error fetching order details:", error);
        document.getElementById('order-items-list').innerHTML = `<div style="padding: 20px; text-align: center; color: #ef4444;">Failed to load order details.</div>`;
    }
});

function sanitizeUrl(url) {
    if (!url) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
    try {
        if (url.includes('amazonaws.com')) {
            const parsed = new URL(url);
            return `https://d2vghmouksu39n.cloudfront.net${parsed.pathname}`;
        }
    } catch (e) {}
    return url;
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

function renderOrderDetails(order, allProducts = []) {
    const orderId = order.orderId || order.id || 'UNKNOWN';
    document.getElementById('breadcrumb-order-id').textContent = `Order History > Order #${orderId}`;

    const dateObj = new Date(order.createdAt || order.updatedAt || Date.now());
    document.getElementById('order-date').textContent = `Placed on ${dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

    const status = (order.status || 'PENDING').toUpperCase();
    let statusColor = '#3b82f6';
    let statusClass = 'status-processing';
    if (status === 'DELIVERED') { statusColor = '#10b981'; statusClass = 'status-delivered'; }
    if (status === 'CANCELLED') { statusColor = '#ef4444'; statusClass = 'status-cancelled'; }

    const statusBadge = document.getElementById('order-status-badge');
    statusBadge.className = `status-badge ${statusClass}`;
    statusBadge.innerHTML = `<span style="display:inline-block; width:6px; height:6px; background:${statusColor}; border-radius:50%; margin-right:4px;"></span>${status.charAt(0) + status.slice(1).toLowerCase()}`;

    // Update Delivery Tracker
    const trackerSteps = document.querySelectorAll('.tracker-step');
    const stepIcons = document.querySelectorAll('.step-icon');
    
    if (status === 'CANCELLED' || status === 'CANCELED') {
        if (trackerSteps[1]) {
            const labelEl = trackerSteps[1].querySelector('.step-label');
            const iconEl = trackerSteps[1].querySelector('.step-icon');
            if (labelEl) {
                labelEl.textContent = 'Cancelled';
                labelEl.classList.add('cancelled');
            }
            if (iconEl) {
                iconEl.className = 'step-icon cancelled';
                iconEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            }
            trackerSteps[1].classList.add('completed');
        }
    } else {
        if (status === 'SHIPPED' || status === 'DELIVERED') {
            if (trackerSteps[1]) trackerSteps[1].classList.add('completed');
            if (stepIcons[1]) stepIcons[1].classList.add('completed');
        }
        if (status === 'DELIVERED') {
            if (trackerSteps[2]) trackerSteps[2].classList.add('completed');
            if (stepIcons[2]) stepIcons[2].classList.add('completed');
        }
    }

    // Item & Financial Summary Calculation
    const items = order.items || [];
    document.getElementById('item-summary-title').textContent = `Item Summary (${items.length})`;
    
    const itemsList = document.getElementById('order-items-list');
    itemsList.innerHTML = '';

    const orderTotal = Number(order.orderTotal || order.totalAmount || order.amount || 0);

    let calculatedItems = [];
    let itemsSubtotal = 0;

    if (items.length > 0) {
        const rawSum = items.reduce((acc, it) => acc + ((it.quantity || 1) * Number(it.price || 0)), 0);

        calculatedItems = items.map(item => {
            const pId = item.productId || item.id;
            const pName = item.name || item.productName || item.title || '';
            
            const realProduct = (pId ? allProducts.find(p => (p.productId || p.id) === pId) : null) || 
                                (pName ? allProducts.find(p => (p.name || p.title || '').toLowerCase() === pName.toLowerCase()) : null) || {};
            
            const isUuidName = !pName || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pName);
            let name = pName;
            if (isUuidName && (realProduct.name || realProduct.title)) {
                name = realProduct.name || realProduct.title;
            } else if (isUuidName && pId) {
                name = `Product (${pId.substring(0, 8)})`;
            }
            if (!name) name = realProduct.name || realProduct.title || 'Product Item';

            const qty = item.quantity || item.qty || 1;

            let price = Number(item.price || 0);
            if (items.length === 1 && orderTotal > 0) {
                // Item total matches Order Total directly
                price = orderTotal / qty;
            } else if (price === 0 || Math.abs(rawSum - orderTotal) > 5) {
                const catalogPrice = Number(realProduct.sellingPrice || realProduct.price || 0);
                if (catalogPrice > 0 && rawSum > 0 && orderTotal > 0) {
                    price = (catalogPrice / rawSum) * orderTotal;
                } else if (orderTotal > 0) {
                    price = orderTotal / (items.reduce((a, b) => a + (b.quantity || 1), 0));
                }
            }

            const itemTotal = qty * price;
            itemsSubtotal += itemTotal;

            let rawImg = item.imageUrl || item.image || realProduct.imageUrl || realProduct.image;
            if (!rawImg && realProduct.images && realProduct.images.length > 0) {
                const firstImg = realProduct.images[0];
                rawImg = typeof firstImg === 'string' ? firstImg : (firstImg.imageUrl || firstImg.url || firstImg.image);
            }

            return {
                name,
                qty,
                price,
                itemTotal,
                imgUrl: sanitizeUrl(rawImg)
            };
        });

        const fallbackImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';

        calculatedItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'ordered-item';
            itemDiv.innerHTML = `
                <div class="item-image">
                    <img src="${item.imgUrl}" alt="${escapeXml(item.name)}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                </div>
                <div class="item-info">
                    <div class="item-name" style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${escapeXml(item.name)}</div>
                    <div class="item-qty-price">Qty: ${item.qty} &nbsp;&nbsp; ₹${Number(item.price).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
                <div class="item-total">₹${Number(item.itemTotal).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            `;
            itemsList.appendChild(itemDiv);
        });
    } else {
        itemsList.innerHTML = `<div style="padding: 20px; text-align: center; color: #64748b;">No items found in this order.</div>`;
    }

    // Financial Summary
    const displaySubtotal = itemsSubtotal > 0 ? itemsSubtotal : orderTotal;
    const displayTotal = displaySubtotal;

    const subtotalEl = document.getElementById('summary-subtotal');
    const shippingEl = document.getElementById('summary-shipping');
    const taxEl = document.getElementById('summary-tax');
    const totalEl = document.getElementById('summary-total');

    if (subtotalEl) subtotalEl.textContent = `₹${displaySubtotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (shippingEl) shippingEl.textContent = `₹30.00`;
    
    // Hide Estimated Tax row completely per user instruction
    if (taxEl) {
        const taxRow = taxEl.closest('.fin-row');
        if (taxRow) taxRow.style.display = 'none';
    }

    if (totalEl) totalEl.textContent = `₹${displayTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const points = Math.floor(displayTotal);
    document.getElementById('summary-points').innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        You earned ${points.toLocaleString()} CloudPoints with this order.
    `;

    // Shipping Address
    const addressContainer = document.getElementById('shipping-address-container');
    if (order.shippingAddress) {
        const addr = order.shippingAddress;
        const name = addr.fullName || addr.name || (addr.firstName ? `${addr.firstName} ${addr.lastName || ''}`.trim() : 'N/A');
        addressContainer.innerHTML = `
            <span class="address-name">${name}</span><br>
            ${addr.addressLine1 || addr.address || addr.street || ''}<br>
            ${addr.city || ''} ${addr.state || ''} ${addr.postalCode || addr.zipCode || ''}<br>
            ${addr.country || ''}
        `;
    } else {
        addressContainer.innerHTML = `<span style="color: #94a3b8;">Address not available</span>`;
    }

    // Payment Method
    const paymentContainer = document.getElementById('payment-method-container');
    paymentContainer.innerHTML = `
        <div class="cc-icon">UPI</div>
        <div class="cc-details">
            <p>Processed via Gateway</p>
            <span>Status: SUCCESS</span>
        </div>
    `;


    // Setup Download Invoice
    const btnDownload = document.getElementById('btn-download-invoice');
    if (btnDownload) {
        btnDownload.onclick = () => {
            if (typeof window.jspdf === 'undefined') {
                alert("PDF library is loading. Please try again in a moment.");
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(22);
            doc.text("CloudBasket", 105, 20, { align: "center" });
            
            doc.setFontSize(16);
            doc.text("Order Invoice / Receipt", 105, 30, { align: "center" });
            
            // Order details
            doc.setFontSize(12);
            doc.text(`Order ID: ${orderId}`, 20, 45);
            doc.text(`Date: ${dateObj.toLocaleDateString()}`, 20, 52);
            doc.text(`Status: ${status}`, 20, 59);
            
            // Customer Info
            const custName = (order.shippingAddress && (order.shippingAddress.fullName || order.shippingAddress.name)) || order.customerName || "CloudBasket Customer";
            const custEmail = (order.shippingAddress && order.shippingAddress.email) || order.customerEmail || "N/A";
            
            doc.text("Customer Details:", 20, 70);
            doc.text(`Name: ${custName}`, 20, 77);
            doc.text(`Email: ${custEmail}`, 20, 84);
            
            // Items
            doc.text("Order Items:", 20, 95);
            let y = 105;
            const pdfItems = calculatedItems && calculatedItems.length > 0 ? calculatedItems : items;
            pdfItems.forEach((item, idx) => {
                const itemName = item.name || item.productId || 'Unknown Item';
                const itemQty = item.qty || item.quantity || 1;
                const itemTotalVal = item.itemTotal || (itemQty * Number(item.price || 0));
                doc.text(`${idx + 1}. ${itemName} (Qty: ${itemQty}) - Rs. ${Number(itemTotalVal).toFixed(2)}`, 25, y);
                y += 7;
            });
            
            y += 10;
            doc.setFontSize(14);
            doc.text(`Total Amount: Rs. ${Number(displayTotal || orderTotal || 0).toFixed(2)}`, 20, y);
            
            y += 15;
            doc.setFontSize(12);
            const paymentMethod = order.paymentMethod || "UPI / Cash On Delivery";
            doc.text(`Payment Success through ${paymentMethod}`, 20, y);
            
            // Seal of approval
            y += 20;
            doc.setTextColor(0, 150, 0); // Green color for seal
            doc.setFontSize(16);
            doc.text("SEAL APPROVED FROM CLOUDBASKET", 105, y, { align: "center" });
            
            // Download
            doc.save(`CloudBasket_Invoice_${orderId}.pdf`);
        };
    }

}