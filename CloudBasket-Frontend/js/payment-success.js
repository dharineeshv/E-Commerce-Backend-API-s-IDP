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
            const invoiceNoEl = document.getElementById('pdf-invoice-no');
            if (invoiceNoEl) invoiceNoEl.textContent = `CB-2026-${orderId.substring(0, 6).toUpperCase()}`;

            const dateEl = document.getElementById('pdf-date');
            if (dateEl) dateEl.textContent = dateObj.toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' });

            const totalFormatted = `₹${Number(amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            const subtotalVal = Number(amount) / 1.08;
            const taxVal = Number(amount) - subtotalVal;

            const subtotalEl = document.getElementById('pdf-subtotal-amount');
            if (subtotalEl) subtotalEl.textContent = `₹${subtotalVal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

            const taxEl = document.getElementById('pdf-tax-amount');
            if (taxEl) taxEl.textContent = `₹${taxVal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

            const totalEl = document.getElementById('pdf-total-amount');
            if (totalEl) totalEl.textContent = totalFormatted;

            // Customer Details
            let custName = "Valued Customer";
            let custEmail = "customer@example.com";
            let addrLine1 = "456 Server Road, Rack 2";
            let addrLine2 = "Data City, TX 75001";

            if (order.shippingAddress) {
                const addr = order.shippingAddress;
                if (addr.name) custName = addr.name;
                else if (addr.fullName) custName = addr.fullName;
                else if (addr.firstName) custName = `${addr.firstName} ${addr.lastName || ''}`.trim();

                if (addr.email && !addr.email.includes("example.com")) custEmail = addr.email;
                if (addr.addressLine1 || addr.street) addrLine1 = addr.addressLine1 || addr.street;
                if (addr.city || addr.state) addrLine2 = `${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || addr.postalCode || ''}`.trim();
            }

            if (custEmail === "customer@example.com" && order.customerId) {
                try {
                    const profileResponse = await apiFetch(`${API.userProfileService}/api/v1/profile/${order.customerId}`);
                    if (profileResponse.ok) {
                        const profileResult = await profileResponse.json();
                        if (profileResult.data) {
                            if (profileResult.data.email) custEmail = profileResult.data.email;
                            if (profileResult.data.fullName) custName = profileResult.data.fullName;
                        }
                    }
                } catch(e) {
                    console.error("Error fetching profile for invoice", e);
                }
            }

            document.getElementById('pdf-customer-name').textContent = custName;
            document.getElementById('pdf-customer-email').textContent = custEmail;
            document.getElementById('pdf-customer-address').textContent = addrLine1;
            document.getElementById('pdf-customer-city').textContent = addrLine2;

            // Items Table (Matching 5 Columns: Item | Description | Qty | Unit Price | Amount)
            const pdfItemsContainer = document.getElementById('pdf-items-container');
            pdfItemsContainer.innerHTML = '';

            if (order.items && order.items.length > 0) {
                order.items.forEach((item, idx) => {
                    const row = document.createElement('tr');
                    row.style.borderBottom = "1px solid #e2e8f0";
                    row.style.backgroundColor = idx % 2 === 0 ? "#ffffff" : "#f8fafc";

                    const itemName = item.name || item.productName || 'Cloud Product';
                    const itemDesc = item.category || item.description || 'Cloud Basket Product';
                    const itemQty = item.quantity || 1;
                    const itemPrice = item.price || 0;
                    const itemTotal = itemQty * itemPrice;

                    row.innerHTML = `
                        <td style="padding: 10px 14px; color: #1e293b; font-size: 13px; font-weight: 600;">${itemName}</td>
                        <td style="padding: 10px 14px; color: #64748b; font-size: 13px;">${itemDesc}</td>
                        <td style="padding: 10px 14px; text-align: center; color: #475569; font-size: 13px;">${itemQty}</td>
                        <td style="padding: 10px 14px; text-align: right; color: #475569; font-size: 13px;">₹${Number(itemPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td style="padding: 10px 14px; text-align: right; color: #1e293b; font-size: 13px; font-weight: 600;">₹${Number(itemTotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    `;
                    pdfItemsContainer.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.style.backgroundColor = "#ffffff";
                row.innerHTML = `
                    <td style="padding: 10px 14px; color: #1e293b; font-size: 13px; font-weight: 600;">CloudBasket Order Item</td>
                    <td style="padding: 10px 14px; color: #64748b; font-size: 13px;">Order Items Package</td>
                    <td style="padding: 10px 14px; text-align: center; color: #475569; font-size: 13px;">1</td>
                    <td style="padding: 10px 14px; text-align: right; color: #475569; font-size: 13px;">${totalFormatted}</td>
                    <td style="padding: 10px 14px; text-align: right; color: #1e293b; font-size: 13px; font-weight: 600;">${totalFormatted}</td>
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
    if (!element) return;
    
    element.style.display = 'block';
    element.style.position = 'fixed';
    element.style.top = '-9999px';
    element.style.left = '0';
    element.style.zIndex = '99999';
    
    const invoiceNo = document.getElementById('pdf-invoice-no')?.textContent || 'CB-2026-085';
    
    const opt = {
        margin:       [0.3, 0.3, 0.3, 0.3],
        filename:     `CloudBasket-Invoice-${invoiceNo}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
        element.style.position = 'static';
    }).catch(err => {
        console.error("PDF Generation Error:", err);
        element.style.display = 'none';
        element.style.position = 'static';
        alert("Failed to generate PDF invoice. Please try again.");
    });
};
