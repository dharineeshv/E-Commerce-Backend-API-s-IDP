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
            document.getElementById('pdf-order-id').textContent = `#${orderId}`;
            document.getElementById('pdf-date').textContent = dateObj.toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' });
            
            const totalFormatted = `₹${Number(amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('pdf-total-amount').textContent = totalFormatted;

            // Extract customer details if available in the shipping address or use fallbacks
            let custName = "CloudBasket Customer";
            let custEmail = "Not Provided";
            
            if (order.shippingAddress) {
                if (order.shippingAddress.name) custName = order.shippingAddress.name;
                else if (order.shippingAddress.fullName) custName = order.shippingAddress.fullName;
                else if (order.shippingAddress.firstName) custName = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim();
                
                if (order.shippingAddress.email) custEmail = order.shippingAddress.email;
            }
            
            document.getElementById('pdf-customer-name').textContent = custName;
            document.getElementById('pdf-customer-email').textContent = custEmail;
            document.getElementById('pdf-customer-id').textContent = order.customerId || 'Not Provided';

            // Populate Items Table
            const pdfItemsContainer = document.getElementById('pdf-items-container');
            pdfItemsContainer.innerHTML = '';
            
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const row = document.createElement('tr');
                    row.style.borderBottom = "1px solid #e2e8f0";
                    
                    const itemName = item.name || item.productName || 'Unknown Item';
                    const prodId = item.productId || 'N/A';
                    const itemQty = item.quantity || 1;
                    const itemPrice = item.price || 0;
                    const itemTotal = itemQty * itemPrice;
                    
                    row.innerHTML = `
                        <td style="padding: 12px; color: #334155; font-size: 15px;">
                            ${itemName}
                            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">ID: ${prodId}</div>
                        </td>
                        <td style="padding: 12px; text-align: center; color: #64748b; font-size: 15px;">${itemQty}</td>
                        <td style="padding: 12px; text-align: right; color: #334155; font-size: 15px; font-weight: 500;">₹${Number(itemTotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    `;
                    pdfItemsContainer.appendChild(row);
                });
            } else {
                // Fallback if no items array exists
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 12px; color: #334155; font-size: 15px;">Order Total (Items not specified)</td>
                    <td style="padding: 12px; text-align: center; color: #64748b; font-size: 15px;">1</td>
                    <td style="padding: 12px; text-align: right; color: #334155; font-size: 15px; font-weight: 500;">${totalFormatted}</td>
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
    
    // Temporarily display block to allow html2pdf to render it, but position it offscreen
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    
    const opt = {
        margin:       0,
        filename:     'CloudBasket-Receipt.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
        // Hide again after generation
        element.style.display = 'none';
        element.style.position = 'static';
        element.style.left = 'auto';
    }).catch(err => {
        console.error("PDF Generation Error:", err);
        element.style.display = 'none';
        alert("Failed to generate PDF receipt. Please try again.");
    });
};
