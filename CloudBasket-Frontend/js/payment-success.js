import { API } from "./config.js";
import { apiFetch } from "./api/apiClient.js";

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    const displayOrderId = document.getElementById('display-order-id');
    const displayTxnId = document.getElementById('display-txn-id');
    const displayAmount = document.getElementById('display-amount');
    const displayDate = document.getElementById('display-date');
    const btnViewOrder = document.getElementById('btn-view-order-details');

    if (!orderId) {
        // Fallback if no order ID is provided
        displayOrderId.textContent = "#UNKNOWN";
        displayAmount.textContent = "₹0.00";
        displayDate.textContent = "Unknown";
        return;
    }

    // Set links
    if (btnViewOrder) {
        btnViewOrder.href = `order-details.html?id=${orderId}`;
    }
    displayOrderId.textContent = `#${orderId}`;

    // Fetch order details
    try {
        const response = await apiFetch(`${API.orderService}/api/v1/order/${orderId}`);
        if (!response.ok) throw new Error("Failed to fetch order");

        const result = await response.json();
        const order = result.data || result;

        if (order && order.orderId) {
            // Amount
            const amount = order.orderTotal || order.totalAmount || order.amount || 0;
            displayAmount.textContent = `₹${Number(amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            // Date
            const dateObj = new Date(order.createdAt || order.updatedAt || Date.now());
            // Format: October 24, 2024 - 14:32 GMT
            const options = { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
            displayDate.textContent = dateObj.toLocaleDateString("en-US", options);

            // Trigger payment success to DB (Simulating Webhook)
            try {
                // Check if payment already exists
                const existingPaymentRes = await apiFetch(`${API.paymentService}/api/v1/payment/order/${orderId}`);
                if (existingPaymentRes.status === 404) {
                    // Create payment with UPI to force SUCCESS status in demo backend
                    await apiFetch(`${API.paymentService}/api/v1/payment`, {
                        method: 'POST',
                        body: JSON.stringify({
                            orderId: orderId,
                            amount: amount,
                            paymentMethod: 'UPI'
                        })
                    });
                    console.log("Payment successfully registered in DB.");
                } else if (existingPaymentRes.ok) {
                    console.log("Payment already exists.");
                }
            } catch (err) {
                console.error("Failed to register payment in DB:", err);
            }

            // Mock a transaction ID since the backend might not provide a distinct payment gateway ID yet
            const mockTxn = `pay_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            displayTxnId.innerHTML = `
                ${mockTxn}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="margin-left: 4px; cursor:pointer;" title="Copy">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            `;

            // --- Populate PDF Template ---
            const custIdEl = document.getElementById('pdf-cust-id');
            if (custIdEl) custIdEl.textContent = `#${order.customerId || 'cust-002'}`;

            const dateStrEl = document.getElementById('pdf-date-str');
            if (dateStrEl) dateStrEl.textContent = dateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });

            const totalFormatted = `₹${Number(amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

            const subtotalEl = document.getElementById('pdf-subtotal-amount');
            if (subtotalEl) subtotalEl.textContent = totalFormatted;

            const taxEl = document.getElementById('pdf-tax-amount');
            if (taxEl) taxEl.textContent = `₹0.00`;

            const totalEl = document.getElementById('pdf-total-amount');
            if (totalEl) totalEl.textContent = totalFormatted;

            // Items Table (4 Columns matching Screenshot 2: DESCRIPTION | QTY | PRICE | TOTAL)
            const pdfItemsContainer = document.getElementById('pdf-items-container');
            pdfItemsContainer.innerHTML = '';

            if (order.items && order.items.length > 0) {
                order.items.forEach((item) => {
                    const row = document.createElement('tr');
                    row.style.borderBottom = "1px solid #f1f5f9";

                    const itemName = item.name || item.productName || item.productId || 'Cloud Basket Product';
                    const itemQty = item.quantity || 1;
                    const itemPrice = item.price || (amount / itemQty);
                    const itemTotal = itemQty * itemPrice;

                    row.innerHTML = `
                        <td style="padding: 12px 0; color: #334155; font-size: 13px;">${itemName}</td>
                        <td style="padding: 12px 0; text-align: center; color: #334155; font-size: 13px;">${itemQty}</td>
                        <td style="padding: 12px 0; text-align: right; color: #334155; font-size: 13px;">₹${Number(itemPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td style="padding: 12px 0; text-align: right; color: #1e293b; font-size: 13px; font-weight: bold;">₹${Number(itemTotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    `;
                    pdfItemsContainer.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.style.borderBottom = "1px solid #f1f5f9";
                row.innerHTML = `
                    <td style="padding: 12px 0; color: #334155; font-size: 13px;">Order Items Package</td>
                    <td style="padding: 12px 0; text-align: center; color: #334155; font-size: 13px;">1</td>
                    <td style="padding: 12px 0; text-align: right; color: #334155; font-size: 13px;">${totalFormatted}</td>
                    <td style="padding: 12px 0; text-align: right; color: #1e293b; font-size: 13px; font-weight: bold;">${totalFormatted}</td>
                `;
                pdfItemsContainer.appendChild(row);
            }

        } else {
            displayAmount.textContent = "₹0.00";
            displayDate.textContent = "Order not found";
        }
    } catch (error) {
        console.error("Error fetching order for success page:", error);
        displayAmount.textContent = "₹---";
        displayDate.textContent = "Error loading date";
    }
});

// Global function for the download button
window.downloadReceipt = function() {
    const element = document.getElementById('invoice-template');
    const wrapper = document.getElementById('invoice-template-wrapper');
    if (!element) return;
    
    if (wrapper) {
        wrapper.style.height = 'auto';
        wrapper.style.overflow = 'visible';
    }
    element.style.display = 'block';
    element.style.position = 'relative';
    element.style.top = '0';
    element.style.left = '0';
    
    const custId = document.getElementById('pdf-cust-id')?.textContent.replace('#', '') || 'cust-002';
    
    const opt = {
        margin:       15,
        filename:     `CloudBasket-Receipt-${custId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, width: 750, windowWidth: 750 },
        jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
        if (wrapper) {
            wrapper.style.height = '0';
            wrapper.style.overflow = 'hidden';
        }
    }).catch(err => {
        console.error("PDF Generation Error:", err);
        element.style.display = 'none';
        if (wrapper) {
            wrapper.style.height = '0';
            wrapper.style.overflow = 'hidden';
        }
    });
};
