import { API } from "./config.js";
import { apiFetch } from "./api/apiClient.js";

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const paymentMethodParam = (urlParams.get('paymentMethod') || '').toUpperCase();

    const titleEl = document.getElementById('success-page-title');
    const displayOrderId = document.getElementById('display-order-id');
    const displayTxnId = document.getElementById('display-txn-id');
    const displayPaymentMethod = document.getElementById('display-payment-method');
    const displayAmount = document.getElementById('display-amount');
    const displayDate = document.getElementById('display-date');
    const btnViewOrder = document.getElementById('btn-view-order-details');
    const pdfPaymentMethod = document.getElementById('pdf-payment-method');

    if (!orderId) {
        if (displayOrderId) displayOrderId.textContent = "#UNKNOWN";
        if (displayAmount) displayAmount.textContent = "₹0.00";
        if (displayDate) displayDate.textContent = new Date().toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
        return;
    }

    if (btnViewOrder) {
        btnViewOrder.href = `order-details.html?id=${orderId}`;
    }
    if (displayOrderId) {
        displayOrderId.textContent = `#${orderId.substring(0, 18)}`;
    }

    let order = null;
    try {
        const response = await apiFetch(`${API.orderService}/api/v1/order/${orderId}`);
        if (response.ok) {
            const result = await response.json();
            order = result.data || result;
        }
    } catch (err) {
        console.warn("Could not fetch order from API, using fallback:", err);
    }

    // Determine payment method (COD vs Online)
    const isCOD = paymentMethodParam === 'COD' || (order && order.paymentMethod === 'COD') || (order && order.shippingAddress && order.shippingAddress.paymentMethod === 'COD');

    // Title Updates
    if (titleEl) {
        titleEl.textContent = isCOD ? "Order Confirmed" : "Payment Successful";
    }

    // Payment Method UI Text
    if (displayPaymentMethod) {
        displayPaymentMethod.innerHTML = isCOD 
            ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle></svg> Cash On Delivery`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f4a8a" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> Razorpay / Online`;
    }

    if (pdfPaymentMethod) {
        pdfPaymentMethod.textContent = isCOD ? "CASH ON DELIVERY" : "RAZORPAY";
    }

    // Amount Calculation
    const rawAmount = order ? (order.orderTotal || order.calculatedTotal || order.totalAmount || order.amount || 0) : 0;
    const amountNum = Number(rawAmount) || 0;
    const formattedAmount = `₹${amountNum.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    if (displayAmount) {
        displayAmount.textContent = formattedAmount;
    }

    // Date & Time Formatting
    let dateObj = new Date(order?.createdAt || order?.updatedAt || Date.now());
    if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
    }

    const formattedDate = dateObj.toLocaleDateString("en-US", {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }) + ", " + dateObj.toLocaleTimeString("en-US", {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (displayDate) {
        displayDate.textContent = formattedDate;
    }

    // Transaction ID formatting using Crypto API (SonarQube compliant)
    let secureOnlineTxnId = 'pay_ONLINE';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const array = new Uint8Array(5);
        window.crypto.getRandomValues(array);
        const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
        secureOnlineTxnId = `pay_${hex}`;
    } else {
        const orderHash = orderId ? orderId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase() : 'ONLINE';
        secureOnlineTxnId = `pay_${orderHash}`;
    }

    const txnIdText = isCOD 
        ? `COD-${orderId.substring(0, 8).toUpperCase()}`
        : secureOnlineTxnId;

    if (displayTxnId) {
        displayTxnId.innerHTML = `
            ${txnIdText} 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="margin-left: 4px; cursor:pointer;" title="Copy" onclick="navigator.clipboard.writeText('${txnIdText}')">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
    }

    // Wire Contact Support button to trigger Chatbot / Robot
    const contactSupportBtn = document.getElementById('contact-support-btn');
    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.toggleChatbot === 'function') {
                window.toggleChatbot();
            } else {
                const fab = document.getElementById('chatbot-fab');
                if (fab) fab.click();
            }
        });
    }

    // --- Populate PDF Invoice Template ---
    let catalogMap = {};
    try {
        const { getAllProducts } = await import("./api/productApi.js");
        const res = await getAllProducts();
        const list = res ? (res.products || res.data || (Array.isArray(res) ? res : [])) : [];
        list.forEach(p => {
            const pId = p.productId || p.id || p.sku;
            if (pId) catalogMap[pId] = p;
        });
    } catch (e) {}

    const custIdEl = document.getElementById('pdf-cust-id');
    if (custIdEl) custIdEl.textContent = `#${(order && order.customerId) ? order.customerId.substring(0, 10) : 'cust-001'}`;

    const dateStrEl = document.getElementById('pdf-date-str');
    if (dateStrEl) dateStrEl.textContent = dateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });

    const subtotalEl = document.getElementById('pdf-subtotal-amount');
    if (subtotalEl) subtotalEl.textContent = formattedAmount;

    const taxEl = document.getElementById('pdf-tax-amount');
    if (taxEl) taxEl.textContent = `₹0.00`;

    const totalEl = document.getElementById('pdf-total-amount');
    if (totalEl) totalEl.textContent = formattedAmount;

    const pdfItemsContainer = document.getElementById('pdf-items-container');
    if (pdfItemsContainer) {
        pdfItemsContainer.innerHTML = '';
        const itemsList = order && order.items && order.items.length > 0 ? order.items : [];

        if (itemsList.length > 0) {
            itemsList.forEach((item) => {
                const row = document.createElement('tr');
                row.style.borderBottom = "1px solid #f1f5f9";

                const itemPid = item.productId || item.id || item.sku;
                const catalogItem = itemPid ? catalogMap[itemPid] : null;

                const rawName = item.name || item.productName || item.title;
                const isUuidName = !rawName || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawName);
                
                let prodName = rawName;
                if (isUuidName && catalogItem && (catalogItem.name || catalogItem.title)) {
                    prodName = catalogItem.name || catalogItem.title;
                } else if (isUuidName && itemPid) {
                    prodName = `Product (${itemPid.substring(0, 8)})`;
                }
                if (!prodName) prodName = 'CloudBasket Product';

                const itemQty = item.quantity || 1;
                let itemPrice = Number(item.price || catalogItem?.price || (amountNum / itemQty)) || 0;
                if (itemsList.length === 1 && amountNum > 0) {
                    itemPrice = amountNum / itemQty;
                }
                const itemTotal = itemQty * itemPrice;

                row.innerHTML = `
                    <td style="padding: 12px 0; color: #334155; font-size: 13px; font-weight: 500;">${escapeXml(prodName)}</td>
                    <td style="padding: 12px 0; text-align: center; color: #334155; font-size: 13px;">${itemQty}</td>
                    <td style="padding: 12px 0; text-align: right; color: #334155; font-size: 13px;">₹${itemPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td style="padding: 12px 0; text-align: right; color: #1e293b; font-size: 13px; font-weight: bold;">₹${itemTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                `;
                pdfItemsContainer.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.style.borderBottom = "1px solid #f1f5f9";
            row.innerHTML = `
                <td style="padding: 12px 0; color: #334155; font-size: 13px; font-weight: 500;">Order Items Package</td>
                <td style="padding: 12px 0; text-align: center; color: #334155; font-size: 13px;">1</td>
                <td style="padding: 12px 0; text-align: right; color: #334155; font-size: 13px;">${formattedAmount}</td>
                <td style="padding: 12px 0; text-align: right; color: #1e293b; font-size: 13px; font-weight: bold;">${formattedAmount}</td>
            `;
            pdfItemsContainer.appendChild(row);
        }
    }
});

function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Global function for receipt download button
window.downloadReceipt = function() {
    const element = document.getElementById('invoice-template');
    if (!element) return;
    
    const custId = document.getElementById('pdf-cust-id')?.textContent.replace('#', '') || 'cust-001';
    
    // Temporarily position element fixed at (0,0) for html2canvas full-width rendering
    const prevPosition = element.style.position;
    const prevLeft = element.style.left;
    const prevTop = element.style.top;
    const prevDisplay = element.style.display;
    const prevZIndex = element.style.zIndex;

    element.style.position = 'fixed';
    element.style.left = '0';
    element.style.top = '0';
    element.style.zIndex = '999999';
    element.style.display = 'block';
    element.style.backgroundColor = '#ffffff';

    const opt = {
        margin:       [20, 20, 20, 20],
        filename:     `CloudBasket-Receipt-${custId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0, windowWidth: 800 },
        jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        element.style.position = prevPosition || 'relative';
        element.style.left = prevLeft || '0';
        element.style.top = prevTop || '0';
        element.style.display = prevDisplay || 'block';
        element.style.zIndex = prevZIndex || '1';
    }).catch(err => {
        console.error("PDF Generation Error:", err);
        element.style.position = prevPosition || 'relative';
        element.style.left = prevLeft || '0';
        element.style.top = prevTop || '0';
        element.style.display = prevDisplay || 'block';
        element.style.zIndex = prevZIndex || '1';
    });
};
