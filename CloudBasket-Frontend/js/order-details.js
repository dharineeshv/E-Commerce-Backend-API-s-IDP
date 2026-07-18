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
    
    if (status === 'SHIPPED' || status === 'DELIVERED') {
        if (trackerSteps[1]) trackerSteps[1].classList.add('completed');
        if (stepIcons[1]) stepIcons[1].classList.add('completed');
    }
    if (status === 'DELIVERED') {
        if (trackerSteps[2]) trackerSteps[2].classList.add('completed');
        if (stepIcons[2]) stepIcons[2].classList.add('completed');
    }

    // Item Summary
    const items = order.items || [];
    document.getElementById('item-summary-title').textContent = `Item Summary (${items.length})`;
    
    const itemsList = document.getElementById('order-items-list');
    itemsList.innerHTML = '';
    
    if (items.length > 0) {
        items.forEach(item => {
            // Find actual product details from the Product API array
            const realProduct = allProducts.find(p => (p.productId || p.id) === (item.productId || item.id));
            
            const name = realProduct ? (realProduct.name || realProduct.title) : (item.name || item.productId || 'Unknown Item');
            const qty = item.quantity || 1;
            const price = item.price || 0;
            const itemTotal = qty * price;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'ordered-item';
            
            // Generate S3 image or fallback
            const imgUrl = realProduct ? (realProduct.imageUrl || realProduct.image) : (item.imageUrl || item.image || `https://via.placeholder.com/150`);

            itemDiv.innerHTML = `
                <div class="item-image">
                    <img src="${imgUrl}" alt="${name}" onerror="this.src='https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=150&q=80'">
                </div>
                <div class="item-info">
                    <div class="item-name" style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${name}</div>
                    <div class="item-qty-price">Qty: ${qty} &nbsp;&nbsp; ₹${Number(price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
                <div class="item-total">₹${Number(itemTotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            `;
            itemsList.appendChild(itemDiv);
        });
    } else {
        itemsList.innerHTML = `<div style="padding: 20px; text-align: center; color: #64748b;">No items found in this order.</div>`;
    }

    // Financial Summary
    const totalAmount = Number(order.orderTotal || order.totalAmount || order.amount || 0);
    // Rough estimate of tax and shipping if not provided by backend directly for display purposes
    const shipping = 25.00;
    const taxRate = 0.08;
    const subtotal = totalAmount / (1 + taxRate) - shipping; // Reversed calculation for dummy data

    document.getElementById('summary-subtotal').textContent = `₹${subtotal > 0 ? subtotal.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}) : '0.00'}`;
    document.getElementById('summary-shipping').textContent = `₹${totalAmount > 0 ? shipping.toFixed(2) : '0.00'}`;
    
    const tax = subtotal > 0 ? subtotal * taxRate : 0;
    document.getElementById('summary-tax').textContent = `₹${tax.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    
    document.getElementById('summary-total').textContent = `₹${totalAmount.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    
    const points = Math.floor(totalAmount);
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
            items.forEach((item, idx) => {
                const itemName = item.name || item.productId || 'Unknown Item';
                const itemQty = item.quantity || 1;
                const itemPrice = item.price || 0;
                doc.text(`${idx + 1}. ${itemName} (Qty: ${itemQty}) - Rs. ${(itemQty * itemPrice).toFixed(2)}`, 25, y);
                y += 7;
            });
            
            y += 10;
            doc.setFontSize(14);
            doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 20, y);
            
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