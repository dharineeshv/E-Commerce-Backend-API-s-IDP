import { getAllAdminPayments, refundPayment } from "./api/paymentApi.js?v=2";
import { getAllOrders } from "./api/orderApi.js?v=2";
import { initializeProfileCard } from "./profile.js?v=2";
import { initializeLogout } from "./logout.js?v=2";
import { initializeSidebar } from "./sidebar.js";
import { getProfile } from "./api/userProfileApi.js?v=2";

const state = {
    allPayments: [],
    allOrders: [],
    filteredPayments: [],
    currentPage: 1,
    itemsPerPage: 10
};

document.addEventListener('DOMContentLoaded', async () => {
    initializeSidebar();
    
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
            state.allPayments = await Promise.all(paymentsRes.payments.map(async payment => {
                const order = state.allOrders.find(o => o.orderId === payment.orderId);
                const shipping = order?.shippingAddress || {};
                
                let customerName = order?.customerName || order?.customer?.name || order?.customer?.fullName || shipping.fullName || shipping.name || (shipping.firstName ? `${shipping.firstName} ${shipping.lastName || ''}`.trim() : null) || "";
                let customerEmail = order?.customerEmail || shipping.email || "";
                
                if (order?.customerId) {
                    try {
                        const profileResponse = await getProfile(order.customerId);
                        if (profileResponse) {
                            customerName = profileResponse?.data?.fullName || profileResponse?.fullName || profileResponse?.data?.name || profileResponse?.name || customerName;
                            customerEmail = profileResponse?.data?.email || profileResponse?.email || customerEmail;
                        }
                    } catch (error) {
                        console.error("Failed to fetch profile for customer:", order.customerId, error);
                    }
                }
                
                customerName = customerName || "Unknown Customer";
                customerEmail = customerEmail || "No Email";
                
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
            }));
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
    setupPagination();
    setupModals();
    initializeProfileCard();
    initializeLogout();
});

function formatCurrency(amount) {
    return `\u20B9${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        renderPagination();
        return;
    }

    const startIdx = (state.currentPage - 1) * state.itemsPerPage;
    const endIdx = startIdx + state.itemsPerPage;
    const paginatedPayments = state.filteredPayments.slice(startIdx, endIdx);

    tbody.innerHTML = paginatedPayments.map(payment => {
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
                <td><span class="status-pill ${statusClass}">â— ${statusText}</span></td>
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

    renderPagination();
}

function setupPagination() {
    const controlsEl = document.getElementById('pagination-controls');
    if (!controlsEl) return;
    
    controlsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (!btn || btn.disabled) return;
        
        const newPage = parseInt(btn.getAttribute('data-page'));
        if (newPage && newPage !== state.currentPage) {
            state.currentPage = newPage;
            renderTable();
        }
    });
}

function renderPagination() {
    const infoEl = document.getElementById('pagination-info');
    const controlsEl = document.getElementById('pagination-controls');
    if (!infoEl || !controlsEl) return;

    const totalItems = state.filteredPayments.length;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage) || 1;
    
    if (totalItems === 0) {
        infoEl.textContent = 'Showing 0 to 0 of 0 payments';
        controlsEl.innerHTML = '';
        return;
    }

    const startIdx = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endIdx = Math.min(state.currentPage * state.itemsPerPage, totalItems);
    infoEl.textContent = `Showing ${startIdx} to ${endIdx} of ${totalItems} payments`;

    let html = '';
    
    html += `<button class="page-btn" data-page="${state.currentPage - 1}" ${state.currentPage === 1 ? 'disabled' : ''}>Previous</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (totalPages <= 5 || i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
            html += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (i === 2 && state.currentPage > 3) {
            html += `<span style="padding: 0 0.5rem;">...</span>`;
        } else if (i === totalPages - 1 && state.currentPage < totalPages - 2) {
            html += `<span style="padding: 0 0.5rem;">...</span>`;
        }
    }

    html += `<button class="page-btn" data-page="${state.currentPage + 1}" ${state.currentPage === totalPages ? 'disabled' : ''}>Next</button>`;

    controlsEl.innerHTML = html;
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
        state.currentPage = 1;
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
            state.currentPage = 1;
            renderTable();
        });
    }

    const exportBtn = document.getElementById('export-payments-excel-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportPaymentsToExcel(state.filteredPayments.length > 0 ? state.filteredPayments : state.allPayments);
        });
    }
}

function exportPaymentsToExcel(paymentsToExport) {
    if (!paymentsToExport || paymentsToExport.length === 0) {
        alert("No payments data available to export.");
        return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#003366" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DataStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CurrencyStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <NumberFormat ss:Format="&#34;&#8377;&#34;#,##0.00"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CenterStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Payments">
  <Table>
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Column ss:Width="180"/>
   <Column ss:Width="220"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="160"/>
   <Row ss:Height="24" ss:StyleID="HeaderStyle">
    <Cell><Data ss:Type="String">Payment ID</Data></Cell>
    <Cell><Data ss:Type="String">Order ID</Data></Cell>
    <Cell><Data ss:Type="String">Customer Name</Data></Cell>
    <Cell><Data ss:Type="String">Customer Email</Data></Cell>
    <Cell><Data ss:Type="String">Amount (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Method</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Payment Date</Data></Cell>
   </Row>`;

    paymentsToExport.forEach(p => {
        xml += `
   <Row ss:Height="20">
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(p.paymentId || '')}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(p.orderId || '')}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(p.customerName || '')}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(p.customerEmail || '')}</Data></Cell>
    <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${Number(p.amount || 0)}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(p.paymentMethod || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(p.status || '')}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(p.dateFormatted || p.paymentDate || '')}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CloudBasket_Payments_Report_${todayStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
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
                        currentViewedPayment.status = 'REFUNDED';
                        
                        // Dynamically update the table row
                        renderTable();
                        
                        // Dynamically update stats
                        renderStats();
                        
                        // Dynamically update the details panel status pill
                        const statusPill = detailsPanel.querySelector('.panel-header-right .status-pill');
                        if (statusPill) {
                            statusPill.textContent = 'REFUNDED';
                            statusPill.className = 'status-pill blue';
                        }
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
}

async function ensureProductCatalog() {
    if (window._productCatalogMap) return window._productCatalogMap;
    try {
        const { getAllProducts } = await import("./api/productApi.js");
        const res = await getAllProducts();
        const list = res ? (res.products || res.data || (Array.isArray(res) ? res : [])) : [];
        const catalogMap = {};
        list.forEach(p => {
            const pId = p.productId || p.id || p.sku;
            if (pId) catalogMap[pId] = p;
        });
        window._productCatalogMap = catalogMap;
        return catalogMap;
    } catch (e) {
        window._productCatalogMap = {};
        return {};
    }
}

async function openPaymentPanel(paymentId) {
    const payment = state.allPayments.find(p => p.paymentId === paymentId);
    if (!payment) return;
    
    currentViewedPayment = payment;

    const catalogMap = await ensureProductCatalog();

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

    if (avatar) avatar.textContent = payment.customerAvatar;
    if (name) name.textContent = payment.customerName;
    if (email) email.textContent = payment.customerEmail;

    // Payment Info Grid
    const paymentIdBox = detailsPanel.querySelectorAll('.payment-info-grid .box-value')[0];
    const currencyBox = detailsPanel.querySelectorAll('.payment-info-grid .box-value')[1];
    
    if (paymentIdBox) paymentIdBox.textContent = payment.paymentId.substring(0, 10);
    if (currencyBox) currencyBox.textContent = "INR (\u20B9)";

    // Order Summary
    const orderSummaryContainer = detailsPanel.querySelector('.order-summary-card');
    if (orderSummaryContainer) {
        let orderHtml = '';
        const items = payment.orderItems || [];
        const totalPaidAmount = Number(payment.amount || 0);

        items.forEach(item => {
            const itemPid = item.productId || item.id || item.sku;
            const catalogItem = (catalogMap && itemPid) ? catalogMap[itemPid] : null;

            const rawName = item.name || item.productName || item.title;
            const isUuidName = !rawName || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawName);
            
            let prodName = rawName;
            if (isUuidName && catalogItem && (catalogItem.name || catalogItem.title)) {
                prodName = catalogItem.name || catalogItem.title;
            } else if (isUuidName && itemPid) {
                prodName = `Product (${itemPid.substring(0, 8)})`;
            }
            if (!prodName) prodName = 'Product Item';

            const qty = item.quantity || item.qty || 1;
            
            let itemPrice = Number(item.price || catalogItem?.price || 0);
            if (items.length === 1 && totalPaidAmount > 0) {
                itemPrice = totalPaidAmount / qty;
            }

            let rawImg = item.imageUrl || item.image || item.bannerImageUrl || catalogItem?.imageUrl || catalogItem?.image || catalogItem?.images?.[0] || catalogItem?.thumbnail;
            if (rawImg && rawImg.includes('amazonaws.com')) {
                try {
                    const parsed = new URL(rawImg);
                    rawImg = `https://cloudbasket-products-personal-dhari.s3.ap-southeast-1.amazonaws.com${parsed.pathname}`;
                } catch (e) {}
            }

            const fallbackImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80';
            const imgUrl = rawImg || fallbackImg;

            orderHtml += `
                <div class="order-item" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${imgUrl}" alt="${escapeXml(prodName)}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0;" onerror="this.onerror=null; this.src='${fallbackImg}';">
                        <div class="item-details">
                            <h4 style="font-size:0.9rem; margin:0 0 2px 0; font-weight: 600; color: #0f172a;">${escapeXml(prodName)}</h4>
                            <p style="margin:0; font-size:0.8rem; color:#64748b;">Qty: ${qty}</p>
                        </div>
                    </div>
                    <div class="item-price" style="font-weight:600; color: #1e293b;">${formatCurrency(itemPrice * qty)}</div>
                </div>
            `;
        });
        orderHtml += `
            <div class="order-total-row" style="margin-top: 12px;">
                <span>Total Amount Paid</span>
                <span class="total-price">${payment.amountFormatted}</span>
            </div>
        `;
        orderSummaryContainer.innerHTML = orderHtml;
    }

    if (detailsPanel) detailsPanel.classList.add('active');
    if (panelOverlay) panelOverlay.classList.add('active');
}

async function populateReceipt(payment) {
    const modal = document.getElementById('receipt-modal');
    if (!modal) return;

    const catalogMap = await ensureProductCatalog();

    const customerDisplayId = payment.customerId || payment.orderId || payment.paymentId;
    modal.querySelector('.receipt-header h3').textContent = `#${String(customerDisplayId).substring(0, 10)}`;

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
        const totalPaidAmount = Number(payment.amount || 0);

        items.forEach(item => {
            const itemPid = item.productId || item.id || item.sku;
            const catalogItem = (catalogMap && itemPid) ? catalogMap[itemPid] : null;

            const rawName = item.name || item.productName || item.title;
            const isUuidName = !rawName || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawName);
            
            let prodName = rawName;
            if (isUuidName && catalogItem && (catalogItem.name || catalogItem.title)) {
                prodName = catalogItem.name || catalogItem.title;
            } else if (isUuidName && itemPid) {
                prodName = `Product (${itemPid.substring(0, 8)})`;
            }
            if (!prodName) prodName = 'Product Item';

            const qty = item.quantity || item.qty || 1;

            let itemUnitPrice = Number(item.price || catalogItem?.price || 0);
            if (items.length === 1 && totalPaidAmount > 0) {
                itemUnitPrice = totalPaidAmount / qty;
            }
            const lineTotal = itemUnitPrice * qty;

            itemsHtml += `
                <tr>
                    <td style="text-align: left; font-weight: 500;">${escapeXml(prodName)}</td>
                    <td>${qty}</td>
                    <td style="text-align: right;">${formatCurrency(itemUnitPrice)}</td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(lineTotal)}</td>
                </tr>
            `;
        });
        tbody.innerHTML = itemsHtml;
    }

    const totalsContainer = modal.querySelector('.totals-col');
    if (totalsContainer) {
        totalsContainer.innerHTML = `
            <div class="total-row"><span>Subtotal</span><span>${payment.amountFormatted}</span></div>
            <div class="total-row"><span>Taxes</span><span>\u20B90.00</span></div>
            <div class="total-row grand-total"><span style="color: #003366;">Paid</span><span>${payment.amountFormatted}</span></div>
        `;
    }
}
