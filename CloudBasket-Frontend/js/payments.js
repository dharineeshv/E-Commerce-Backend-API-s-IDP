import { getAllAdminPayments, refundPayment } from "./api/paymentApi.js";
import { getAllOrders } from "./api/orderApi.js";
import { initializeProfileCard } from "./profile.js";
import { initializeLogout } from "./logout.js";

const state = {
    allPayments: [],
    allOrders: [],
    filteredPayments: []
};

document.addEventListener('DOMContentLoaded', async () => {
    
    // Sidebar toggle (standard dashboard feature)
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    renderSkeleton();

    // Fetch from Backend
    try {
        const [paymentsRes, ordersRes] = await Promise.all([
            getAllAdminPayments(),
            getAllOrders()
        ]);

        if (ordersRes && ordersRes.success && ordersRes.data) {
            state.allOrders = ordersRes.data;
        }

        if (paymentsRes && paymentsRes.success && paymentsRes.payments) {
            // Map payment data with order data to get customer info
            state.allPayments = paymentsRes.payments.map(payment => {
                const order = state.allOrders.find(o => o.orderId === payment.orderId);
                const shipping = order?.shippingAddress || {};
                const customerName = shipping.fullName || "Unknown Customer";
                const customerEmail = shipping.email || "No Email";
                const items = order?.items || [];
                const initials = customerName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

                return {
                    ...payment,
                    customerName,
                    customerEmail,
                    customerAvatar: initials,
                    orderItems: items,
                    amountFormatted: formatCurrency(payment.amount),
                    dateFormatted: new Date(payment.paymentDate).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
                };
            });
            // Sort by date descending
            state.allPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
        }

    } catch (e) {
        console.error("Failed to load data", e);
        renderError();
        return;
    }

    state.filteredPayments = [...state.allPayments];
    
    renderAll();
    setupFilters();
    setupModals();
    initializeProfileCard();
    initializeLogout();
});

function formatCurrency(amount) {
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderAll() {
    renderTable();
    renderStats();
}

function renderSkeleton() {
    const tbody = document.getElementById('payments-table-body');
    let skeletonHtml = '';
    for(let i=0; i<8; i++) {
        skeletonHtml += `
            <tr>
                <td colspan="8">
                    <div style="width: 100%; height: 40px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px;"></div>
                </td>
            </tr>
        `;
    }
    if(tbody) tbody.innerHTML = skeletonHtml;
    
    if (!document.getElementById('skeleton-styles')) {
        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.innerHTML = `@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`;
        document.head.appendChild(style);
    }
}

function renderError() {
    const tbody = document.getElementById('payments-table-body');
    if(tbody) tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px;">
                <div style="color: #ef4444; margin-bottom: 10px;">
                    <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin:0 auto; display:block;">
                        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3>Failed to load payments</h3>
                <p style="color: #64748b; margin-top: 5px;">There was a problem connecting to the backend.</p>
                <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
            </td>
        </tr>
    `;
}

function renderEmpty() {
    const tbody = document.getElementById('payments-table-body');
    if(tbody) tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px;">
                <div style="color: #94a3b8; margin-bottom: 10px;">
                    <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin:0 auto; display:block;">
                        <path d="M21 8v13H3V8"></path><path d="M1 3h22v5H1z"></path><path d="M10 12h4"></path>
                    </svg>
                </div>
                <h3>No payments found</h3>
                <p style="color: #64748b; margin-top: 5px;">There are no payments matching your criteria.</p>
            </td>
        </tr>
    `;
}

function renderTable() {
    const tbody = document.getElementById('payments-table-body');
    if (!tbody) return;

    if (state.filteredPayments.length === 0) {
        renderEmpty();
        return;
    }

    tbody.innerHTML = state.filteredPayments.map(payment => {
        let statusClass = "pending";
        let statusText = "Pending";
        if (payment.status?.toUpperCase() === "SUCCESS") {
            statusClass = "success";
            statusText = "Success";
        } else if (payment.status?.toUpperCase() === "FAILED") {
            statusClass = "failed";
            statusText = "Failed";
        } else if (payment.status?.toUpperCase() === "REFUNDED") {
            statusClass = "blue";
            statusText = "Refunded";
        }

        return `
            <tr>
                <td>
                    <button class="action-btn view-details-btn" data-id="${payment.paymentId}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003366" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
                <td class="font-bold">${payment.paymentId.substring(0, 10)}...</td>
                <td class="text-gray">#${payment.orderId.substring(0, 8)}...</td>
                <td>
                    <div class="customer-cell">
                        <div class="avatar bg-light-blue text-blue">${payment.customerAvatar}</div>
                        <div class="customer-name">${payment.customerName}</div>
                    </div>
                </td>
                <td class="font-bold">${payment.amountFormatted}</td>
                <td class="text-gray">${payment.paymentMethod || 'N/A'}</td>
                <td><span class="status-pill ${statusClass}">● ${statusText}</span></td>
                <td class="text-gray text-sm">${payment.dateFormatted}</td>
            </tr>
        `;
    }).join("");

    // Attach view listeners
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.target.closest('.view-details-btn');
            if (button) {
                const paymentId = button.getAttribute('data-id');
                openPaymentPanel(paymentId);
            }
        });
    });
}

function renderStats() {
    let refunded = 0;
    let pending = 0;
    let failed = 0;
    let todayRev = 0;
    let totalRev = 0;
    let totalTransactions = state.allPayments.length;
    
    const today = new Date().toDateString();

    state.allPayments.forEach(p => {
        if (p.status?.toUpperCase() === "REFUNDED") {
            refunded++;
        }
        if (p.status?.toUpperCase() === "PENDING") {
            pending++;
        }
        if (p.status?.toUpperCase() === "FAILED") {
            failed++;
        }
        if (p.status?.toUpperCase() === "SUCCESS") {
            totalRev += Number(p.amount);
            if (new Date(p.paymentDate).toDateString() === today) {
                todayRev += Number(p.amount);
            }
        }
    });

    const statRefunded = document.getElementById('stat-refunded');
    const statPending = document.getElementById('stat-pending');
    const statFailed = document.getElementById('stat-failed');
    const statToday = document.getElementById('stat-today-revenue');
    const statTotal = document.getElementById('stat-total-revenue');
    const statTotalTrans = document.getElementById('stat-total-transactions');

    if(statRefunded) statRefunded.textContent = refunded;
    if(statPending) statPending.textContent = pending;
    if(statFailed) statFailed.textContent = failed;
    if(statToday) statToday.textContent = formatCurrency(todayRev);
    if(statTotal) statTotal.textContent = formatCurrency(totalRev);
    if(statTotalTrans) statTotalTrans.textContent = totalTransactions.toLocaleString();
}

function setupFilters() {
    const searchInput = document.getElementById('search-payment');
    const statusSelect = document.getElementById('filter-status');
    const methodSelect = document.getElementById('filter-method');
    const applyBtn = document.getElementById('apply-filters-btn');
    const clearBtn = document.getElementById('clear-filters-btn');

    const applyFilters = () => {
        const term = (searchInput.value || "").toLowerCase();
        const status = (statusSelect.value || "").toUpperCase();
        const method = (methodSelect.value || "").toUpperCase();

        state.filteredPayments = state.allPayments.filter(p => {
            const matchesSearch = !term || 
                p.paymentId.toLowerCase().includes(term) ||
                p.orderId.toLowerCase().includes(term) ||
                p.customerName.toLowerCase().includes(term);
            
            const matchesStatus = !status || p.status?.toUpperCase() === status;
            const matchesMethod = !method || p.paymentMethod?.toUpperCase() === method;

            return matchesSearch && matchesStatus && matchesMethod;
        });
        renderTable();
    };

    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(searchInput) searchInput.value = "";
            if(statusSelect) statusSelect.value = "";
            if(methodSelect) methodSelect.value = "";
            state.filteredPayments = [...state.allPayments];
            renderTable();
        });
    }
}

// Global variable for current viewed payment to pass to receipt
let currentViewedPayment = null;

function setupModals() {
    const panelOverlay = document.getElementById('payment-details-overlay');
    const detailsPanel = document.getElementById('payment-details-panel');
    const closePanelBtn = document.getElementById('close-panel-btn');
    
    const openReceiptBtn = document.getElementById('open-receipt-btn');
    const receiptModalOverlay = document.getElementById('receipt-modal-overlay');
    const receiptModal = document.getElementById('receipt-modal');
    const closeReceiptBtn = document.getElementById('close-receipt-btn');
    const refundBtn = document.querySelector('.btn-refund');

    if (closePanelBtn) closePanelBtn.addEventListener('click', closePanel);
    if (panelOverlay) panelOverlay.addEventListener('click', closePanel);

    function closePanel() {
        if (detailsPanel) detailsPanel.classList.remove('active');
        if (panelOverlay) panelOverlay.classList.remove('active');
    }

    if (openReceiptBtn) {
        openReceiptBtn.addEventListener('click', () => {
            if (currentViewedPayment) {
                populateReceipt(currentViewedPayment);
                if (receiptModal) receiptModal.classList.add('active');
                if (receiptModalOverlay) receiptModalOverlay.classList.add('active');
                closePanel();
            }
        });
    }

    if (closeReceiptBtn) closeReceiptBtn.addEventListener('click', closeReceipt);
    if (receiptModalOverlay) receiptModalOverlay.addEventListener('click', closeReceipt);

    function closeReceipt() {
        if (receiptModal) receiptModal.classList.remove('active');
        if (receiptModalOverlay) receiptModalOverlay.classList.remove('active');
    }

    if (refundBtn) {
        refundBtn.addEventListener('click', async () => {
            if (currentViewedPayment && currentViewedPayment.status?.toUpperCase() === 'SUCCESS') {
                const c = confirm(`Are you sure you want to refund Payment ${currentViewedPayment.paymentId}?`);
                if (c) {
                    refundBtn.disabled = true;
                    const res = await refundPayment(currentViewedPayment.paymentId);
                    if (res && res.success) {
                        alert("Payment refunded successfully.");
                        location.reload(); // Reload to refresh everything easily
                    } else {
                        alert("Failed to refund payment.");
                    }
                    refundBtn.disabled = false;
                }
            } else {
                alert("Only successful payments can be refunded.");
            }
        });
    }

    const printBtn = document.querySelector('.btn-print');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            if (!currentViewedPayment) return;
            const element = document.querySelector('.receipt-content');
            if (!element) return;

            // Temporarily hide buttons for the PDF
            const actions = element.querySelector('.receipt-actions');
            if (actions) actions.style.display = 'none';

            const opt = {
                margin:       0.5,
                filename:     `receipt_${currentViewedPayment.paymentId}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                // Restore buttons
                if (actions) actions.style.display = 'flex';
            });
        });
    }
}

function openPaymentPanel(paymentId) {
    const payment = state.allPayments.find(p => p.paymentId === paymentId);
    if (!payment) return;
    
    currentViewedPayment = payment;

    const detailsPanel = document.getElementById('payment-details-panel');
    const panelOverlay = document.getElementById('payment-details-overlay');
    
    // Update Panel Header
    const titleId = detailsPanel.querySelector('.panel-title-id');
    const statusPill = detailsPanel.querySelector('.panel-header-right .status-pill');
    if (titleId) titleId.textContent = `${payment.paymentId.substring(0, 15)}...`;
    
    if (statusPill) {
        statusPill.textContent = payment.status?.toUpperCase();
        statusPill.className = 'status-pill'; // reset
        if (payment.status?.toUpperCase() === 'SUCCESS') statusPill.classList.add('success-light');
        else if (payment.status?.toUpperCase() === 'FAILED') statusPill.classList.add('failed');
        else if (payment.status?.toUpperCase() === 'REFUNDED') statusPill.classList.add('blue');
        else statusPill.classList.add('pending');
    }

    // Customer Details
    const avatar = detailsPanel.querySelector('.customer-header-row .avatar');
    const name = detailsPanel.querySelector('.customer-header-row h3');
    const email = detailsPanel.querySelectorAll('.customer-info-row .info-value')[0];
    const phone = detailsPanel.querySelectorAll('.customer-info-row .info-value')[1]; // Currently not available in order model natively, can mock or omit

    if (avatar) avatar.textContent = payment.customerAvatar;
    if (name) name.textContent = payment.customerName;
    if (email) email.textContent = payment.customerEmail;
    if (phone) phone.textContent = "N/A"; // Or extract from shippingAddress if available

    // Payment Info Grid
    const paymentIdBox = detailsPanel.querySelectorAll('.payment-info-grid .box-value')[0];
    const currencyBox = detailsPanel.querySelectorAll('.payment-info-grid .box-value')[1];
    
    if (paymentIdBox) paymentIdBox.textContent = payment.paymentId.substring(0, 10);
    if (currencyBox) currencyBox.textContent = "INR (₹)";

    // Order Summary
    const orderSummaryContainer = detailsPanel.querySelector('.order-summary-card');
    if (orderSummaryContainer) {
        let orderHtml = '';
        const items = payment.orderItems || [];
        items.forEach(item => {
            orderHtml += `
                <div class="order-item">
                    <div class="item-img bg-light-gray"></div>
                    <div class="item-details">
                        <h4 style="font-size:0.85rem;">${item.name || item.productId}</h4>
                        <p>Qty: ${item.quantity}</p>
                    </div>
                    <div class="item-price">${formatCurrency(item.price)}</div>
                </div>
            `;
        });
        orderHtml += `
            <div class="order-total-row">
                <span>Total Amount Paid</span>
                <span class="total-price">${payment.amountFormatted}</span>
            </div>
        `;
        orderSummaryContainer.innerHTML = orderHtml;
    }

    if (detailsPanel) detailsPanel.classList.add('active');
    if (panelOverlay) panelOverlay.classList.add('active');
}

function populateReceipt(payment) {
    const modal = document.getElementById('receipt-modal');
    if (!modal) return;

    modal.querySelector('.receipt-header h3').textContent = `#${payment.customerId}`;

    const txInfo = modal.querySelectorAll('.info-table .info-row .val');
    if (txInfo.length >= 3) {
        txInfo[0].textContent = new Date(payment.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        txInfo[1].textContent = payment.status?.toUpperCase();
        txInfo[2].textContent = payment.paymentMethod?.toUpperCase();
    }

    const tbody = modal.querySelector('.receipt-table tbody');
    if (tbody) {
        let itemsHtml = '';
        const items = payment.orderItems || [];
        items.forEach(item => {
            const total = item.quantity * item.price;
            itemsHtml += `
                <tr>
                    <td style="text-align: left;">${item.name || item.productId}</td>
                    <td>${item.quantity}</td>
                    <td style="text-align: right;">${formatCurrency(item.price)}</td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(total)}</td>
                </tr>
            `;
        });
        tbody.innerHTML = itemsHtml;
    }

    const totalsContainer = modal.querySelector('.totals-col');
    if (totalsContainer) {
        totalsContainer.innerHTML = `
            <div class="total-row"><span>Subtotal</span><span>${payment.amountFormatted}</span></div>
            <div class="total-row"><span>Taxes</span><span>₹0.00</span></div>
            <div class="total-row grand-total"><span style="color: #003366;">Paid</span><span>${payment.amountFormatted}</span></div>
        `;
    }
}
