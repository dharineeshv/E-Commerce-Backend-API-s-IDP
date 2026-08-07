import { initializeLogout } from "./logout.js";
import { initializeProfileCard } from "./profile.js";
import { initializeSidebar } from "./sidebar.js";
import { API } from "./config.js";
import { apiFetch } from "./api/apiClient.js";
import { getAllOrders } from "./api/orderApi.js";

let allCustomers = [];
let filteredCustomersList = [];
let dateFromFilter = null;
let dateToFilter = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeLogout();
    initializeProfileCard();
    initializeSidebar();
    loadCustomersData();
    setupEventListeners();
});

async function loadCustomersData() {
    let customerProfiles = [];
    let orderStatsMap = {};
    let allOrdersList = [];

    // 1. Fetch real order data from Order Service
    try {
        const orderResData = await getAllOrders();
        if (orderResData) {
            allOrdersList = orderResData.data || orderResData.orders || (Array.isArray(orderResData) ? orderResData : []);
        }

        if (!Array.isArray(allOrdersList) || allOrdersList.length === 0) {
            // Direct Endpoint Fallback
            let directRes = await apiFetch(`${API.orderService}/api/v1/order/admin/all`);
            if (!directRes.ok) {
                directRes = await apiFetch(`${API.orderService}/api/v1/orders/admin/all`);
            }
            if (directRes.ok) {
                const resJson = await directRes.json();
                allOrdersList = resJson.data || resJson.orders || (Array.isArray(resJson) ? resJson : []);
            }
        }

        if (Array.isArray(allOrdersList)) {
            allOrdersList.forEach(o => {
                const orderKeys = new Set();
                if (o.customerId) orderKeys.add(String(o.customerId).toLowerCase());
                if (o.customerId) orderKeys.add(String(o.customerId).replace(/^cust-/i, '').toLowerCase());
                if (o.customerId) orderKeys.add(`cust-${String(o.customerId).replace(/^cust-/i, '')}`.toLowerCase());
                if (o.customerEmail) orderKeys.add(String(o.customerEmail).toLowerCase());
                if (o.email) orderKeys.add(String(o.email).toLowerCase());
                if (o.userSub) orderKeys.add(String(o.userSub).toLowerCase());

                const ship = o.shippingAddress || {};
                if (ship.email) orderKeys.add(String(ship.email).toLowerCase());
                if (ship.customerEmail) orderKeys.add(String(ship.customerEmail).toLowerCase());

                const st = (o.orderStatus || o.status || '').toUpperCase();
                const totalAmt = Number(o.orderTotal || o.calculatedTotal || o.totalAmount || o.price || 0);

                orderKeys.forEach(k => {
                    if (!orderStatsMap[k]) {
                        orderStatsMap[k] = { count: 0, spent: 0, cancelled: 0, latestShipping: null, rawOrders: [] };
                    }
                    orderStatsMap[k].rawOrders.push(o);
                    if (ship && (ship.address || ship.city || ship.fullName)) {
                        orderStatsMap[k].latestShipping = ship;
                    }

                    if (st === 'CANCELLED' || st === 'CANCELED') {
                        orderStatsMap[k].cancelled += 1;
                    } else {
                        orderStatsMap[k].count += 1;
                        orderStatsMap[k].spent += totalAmt;
                    }
                });
            });
        }
    } catch (e) {
        console.warn("Order service data fetch warning:", e);
    }

    // 2. Fetch real User Profiles from User Profile Service
    try {
        let res = await apiFetch(`${API.userProfileService}/api/v1/profile/admin/all`);
        if (!res.ok) {
            res = await apiFetch(`${API.userProfileService}/api/v1/profile/all`);
        }

        if (res.ok) {
            const data = await res.json();
            const fetched = data.data || data.users || data.profiles || (Array.isArray(data) ? data : []);
            if (Array.isArray(fetched) && fetched.length > 0) {
                customerProfiles = fetched;
            }
        }
    } catch (e) {
        console.warn("Unable to fetch all profiles, trying /me profile...", e);
    }

    // 3. Fallback to /me logged in admin profile if all profiles is empty
    if (customerProfiles.length === 0) {
        try {
            const token = localStorage.getItem("accessToken");
            if (token) {
                const res = await apiFetch(`${API.userProfileService}/api/v1/profile/me`);
                if (res.ok) {
                    const data = await res.json();
                    const u = data.data || data;
                    if (u && (u.email || u.fullName || u.customerId)) {
                        customerProfiles.push(u);
                    }
                }
            }
        } catch (e) {
            console.warn("Failed fetching /me profile", e);
        }
    }

    // 4. Map profiles into clean customer data structure with deduplicated metrics
    const processedProfileKeys = new Set();

    allCustomers = customerProfiles.map((u, idx) => {
        const profileKeys = new Set();
        if (u.customerId) profileKeys.add(String(u.customerId).toLowerCase());
        if (u.customerId) profileKeys.add(String(u.customerId).replace(/^cust-/i, '').toLowerCase());
        if (u.customerId) profileKeys.add(`cust-${String(u.customerId).replace(/^cust-/i, '')}`.toLowerCase());
        if (u.email) profileKeys.add(String(u.email).toLowerCase());
        if (u.cognitoSub) profileKeys.add(String(u.cognitoSub).toLowerCase());

        let matchedOrders = new Set();
        let latestShipping = null;

        profileKeys.forEach(k => {
            processedProfileKeys.add(k);
            if (orderStatsMap[k]) {
                if (orderStatsMap[k].latestShipping) {
                    latestShipping = orderStatsMap[k].latestShipping;
                }
                (orderStatsMap[k].rawOrders || []).forEach(o => matchedOrders.add(o));
            }
        });

        const matchedOrdersArr = Array.from(matchedOrders);
        let count = 0;
        let spent = 0;
        let cancelled = 0;

        matchedOrdersArr.forEach(o => {
            const st = (o.orderStatus || o.status || '').toUpperCase();
            const totalAmt = Number(o.orderTotal || o.calculatedTotal || o.totalAmount || o.price || 0);
            if (st === 'CANCELLED' || st === 'CANCELED') {
                cancelled += 1;
            } else {
                count += 1;
                spent += totalAmt;
            }
        });

        // Resolve customer email first
        let email = u.email;
        if ((!email || email.toLowerCase().includes('google-sso') || email.toLowerCase() === 'customer@example.com') && latestShipping) {
            email = latestShipping.email || latestShipping.customerEmail || email;
        }
        if ((!email || email.toLowerCase().includes('google-sso')) && matchedOrdersArr.length > 0) {
            for (const o of matchedOrdersArr) {
                const oEmail = o.customerEmail || o.email || (o.shippingAddress && o.shippingAddress.email);
                if (oEmail && !oEmail.toLowerCase().includes('google-sso') && oEmail !== 'customer@example.com') {
                    email = oEmail;
                    break;
                }
            }
        }
        if (!email || email.toLowerCase().includes('google-sso') || email.toLowerCase() === 'customer@example.com') {
            email = `customer_${String(idx + 1).padStart(3, '0')}@cloudbasket.com`;
        }

        // Resolve customer name
        let rawName = u.fullName || u.name || u.username;
        const isSsoPlaceholder = !rawName || 
            rawName.trim().toLowerCase() === 'customer' || 
            rawName.trim().toLowerCase().includes('google-sso') ||
            rawName.trim().toLowerCase() === 'google sso user';

        let name = rawName;
        if (isSsoPlaceholder && latestShipping) {
            name = latestShipping.fullName || latestShipping.name || (latestShipping.firstName ? `${latestShipping.firstName} ${latestShipping.lastName || ''}`.trim() : null);
        }
        if (!name || isSsoPlaceholder || name.trim().toLowerCase().includes('google-sso')) {
            name = email;
        }

        // Resolve location
        let location = u.city ? `${u.city}, ${u.state || ''}` : u.location;
        if ((!location || location === 'N/A') && latestShipping) {
            location = latestShipping.city ? `${latestShipping.city}, ${latestShipping.state || ''}` : (latestShipping.address || 'N/A');
        }
        if (!location) location = 'N/A';

        // Resolve delivery address
        let address = u.address;
        if ((!address || address === 'N/A') && latestShipping) {
            const parts = [latestShipping.address || latestShipping.addressLine1, latestShipping.city, latestShipping.state, latestShipping.pincode || latestShipping.zipCode].filter(Boolean);
            address = parts.length > 0 ? parts.join(', ') : 'N/A';
        }
        if (!address) address = 'N/A';

        return {
            id: u.customerId ? `#${u.customerId.toUpperCase()}` : `#CUST-${String(idx + 1).padStart(3, '0')}`,
            name: name,
            email: email,
            location: location,
            regDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            rawDate: u.createdAt || null,
            ordersCount: count,
            totalSpent: spent,
            cancelledCount: cancelled,
            status: u.status || 'Active',
            address: address
        };
    });

    filteredCustomersList = [...allCustomers];
    renderCustomerTable(allCustomers);
    updateStats(allCustomers);
}

function updateStats(customers) {
    const totalCustEl = document.getElementById('stat-total-customers');
    const activeCustEl = document.getElementById('stat-active-customers');
    const activeBadgeEl = document.getElementById('stat-active-badge');
    const newCustEl = document.getElementById('stat-new-customers');
    const ltvEl = document.getElementById('stat-ltv');
    const summaryEl = document.getElementById('pagination-summary');

    // Total Customers
    const total = customers.length;
    if (totalCustEl) totalCustEl.innerText = total.toLocaleString('en-IN');

    // Active Customers & Percentage Badge
    const activeCount = customers.filter(c => c.status !== 'Inactive').length;
    if (activeCustEl) activeCustEl.innerText = activeCount.toLocaleString('en-IN');
    if (activeBadgeEl) {
        const activePercent = total > 0 ? Math.round((activeCount / total) * 100) : 0;
        activeBadgeEl.innerText = `${activePercent}% Active`;
    }

    // New Customers (Registered in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCount = customers.filter(c => {
        if (!c.rawDate) return false;
        const d = new Date(c.rawDate);
        return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
    }).length;

    if (newCustEl) {
        newCustEl.innerText = newCount.toLocaleString('en-IN');
    }

    // Total Lifetime Value (LTV)
    const totalLtv = customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);
    if (ltvEl) {
        if (totalLtv >= 100000) {
            ltvEl.innerText = `₹${(totalLtv / 100000).toFixed(1)}L`;
        } else {
            ltvEl.innerText = `₹${totalLtv.toLocaleString('en-IN')}`;
        }
    }

    // Dynamic Pagination Summary
    if (summaryEl) {
        if (total === 0) {
            summaryEl.innerText = `Showing 0 - 0 of 0 customers`;
        } else {
            summaryEl.innerText = `Showing 1 - ${total} of ${total} customers`;
        }
    }
}

function renderCustomerTable(customers) {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">No registered customers found matching criteria.</td></tr>`;
        return;
    }

    customers.forEach(cust => {
        const tr = document.createElement('tr');
        const formattedSpent = `₹${Number(cust.totalSpent).toLocaleString('en-IN')}`;

        tr.innerHTML = `
            <td class="cust-id">${cust.id}</td>
            <td>
                <div class="cust-user-cell">
                    <span class="cust-name">${cust.name}</span>
                </div>
            </td>
            <td>
                <div class="cust-contact-cell">
                    <span class="cust-email">${cust.email}</span>
                </div>
            </td>
            <td>${cust.location}</td>
            <td>${cust.regDate}</td>
            <td><span class="cust-orders-badge">${cust.ordersCount}</span></td>
            <td class="cust-spent">${formattedSpent}</td>
            <td>
                <button class="btn-view-details" data-id="${cust.id}">View Details</button>
            </td>
        `;

        const btnView = tr.querySelector('.btn-view-details');
        if (btnView) {
            btnView.addEventListener('click', () => openCustomerModal(cust));
        }

        tbody.appendChild(tr);
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('customer-search');
    const statusFilter = document.getElementById('status-filter');
    const btnDateRange = document.getElementById('btn-date-range');
    const btnExport = document.getElementById('btn-export');

    const dateModal = document.getElementById('date-range-modal');
    const dateModalClose = document.getElementById('date-modal-close');
    const btnApplyDate = document.getElementById('btn-apply-date');
    const btnResetDate = document.getElementById('btn-reset-date');
    const inputDateFrom = document.getElementById('date-from-input');
    const inputDateTo = document.getElementById('date-to-input');
    const presetBtns = document.querySelectorAll('.date-preset-btn');

    function applyFilters() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedStatus = statusFilter ? statusFilter.value : 'all';

        filteredCustomersList = allCustomers.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(query) || 
                                  c.email.toLowerCase().includes(query) || 
                                  c.id.toLowerCase().includes(query);
            const matchesStatus = selectedStatus === 'all' || c.status.toLowerCase() === selectedStatus.toLowerCase();
            
            let matchesDate = true;
            if (c.rawDate) {
                const regDateObj = new Date(c.rawDate);
                if (dateFromFilter) {
                    matchesDate = matchesDate && regDateObj >= dateFromFilter;
                }
                if (dateToFilter) {
                    matchesDate = matchesDate && regDateObj <= dateToFilter;
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        });

        renderCustomerTable(filteredCustomersList);
        updateStats(filteredCustomersList);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    // Date Range Modal Open/Close
    if (btnDateRange && dateModal) {
        btnDateRange.addEventListener('click', () => dateModal.classList.add('open'));
    }
    if (dateModalClose && dateModal) {
        dateModalClose.addEventListener('click', () => dateModal.classList.remove('open'));
    }
    if (dateModal) {
        dateModal.addEventListener('click', (e) => {
            if (e.target === dateModal) dateModal.classList.remove('open');
        });
    }

    // Date Preset Buttons
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset');
            const now = new Date();

            if (preset === 'all') {
                dateFromFilter = null;
                dateToFilter = null;
                if (inputDateFrom) inputDateFrom.value = '';
                if (inputDateTo) inputDateTo.value = '';
            } else if (preset === 'today') {
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                dateFromFilter = todayStart;
                dateToFilter = todayEnd;
                if (inputDateFrom) inputDateFrom.value = todayStart.toISOString().slice(0, 10);
                if (inputDateTo) inputDateTo.value = todayEnd.toISOString().slice(0, 10);
            } else if (preset === '7days') {
                const past = new Date();
                past.setDate(past.getDate() - 7);
                dateFromFilter = past;
                dateToFilter = new Date();
                if (inputDateFrom) inputDateFrom.value = past.toISOString().slice(0, 10);
                if (inputDateTo) inputDateTo.value = new Date().toISOString().slice(0, 10);
            } else if (preset === '30days') {
                const past = new Date();
                past.setDate(past.getDate() - 30);
                dateFromFilter = past;
                dateToFilter = new Date();
                if (inputDateFrom) inputDateFrom.value = past.toISOString().slice(0, 10);
                if (inputDateTo) inputDateTo.value = new Date().toISOString().slice(0, 10);
            } else if (preset === 'month') {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                dateFromFilter = firstDay;
                dateToFilter = lastDay;
                if (inputDateFrom) inputDateFrom.value = firstDay.toISOString().slice(0, 10);
                if (inputDateTo) inputDateTo.value = lastDay.toISOString().slice(0, 10);
            }

            applyFilters();
            if (dateModal) dateModal.classList.remove('open');
        });
    });

    // Custom Date Range Apply/Reset
    if (btnApplyDate) {
        btnApplyDate.addEventListener('click', () => {
            const valFrom = inputDateFrom ? inputDateFrom.value : '';
            const valTo = inputDateTo ? inputDateTo.value : '';

            dateFromFilter = valFrom ? new Date(valFrom + 'T00:00:00') : null;
            dateToFilter = valTo ? new Date(valTo + 'T23:59:59') : null;

            applyFilters();
            if (dateModal) dateModal.classList.remove('open');
        });
    }

    if (btnResetDate) {
        btnResetDate.addEventListener('click', () => {
            dateFromFilter = null;
            dateToFilter = null;
            if (inputDateFrom) inputDateFrom.value = '';
            if (inputDateTo) inputDateTo.value = '';
            applyFilters();
            if (dateModal) dateModal.classList.remove('open');
        });
    }

    // Export to Excel (.xls/.xlsx Spreadsheet)
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            exportCustomersToExcel(filteredCustomersList);
        });
    }

    // Modal Details Close
    const modalClose = document.getElementById('cust-modal-close');
    const modalOverlay = document.getElementById('cust-modal-overlay');
    if (modalClose && modalOverlay) {
        modalClose.addEventListener('click', () => modalOverlay.classList.remove('open'));
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) modalOverlay.classList.remove('open');
        });
    }
}

function exportCustomersToExcel(dataToExport) {
    if (!dataToExport || dataToExport.length === 0) {
        if (window.showCustomAlert) {
            window.showCustomAlert("No customer data available to export.");
        } else {
            alert("No customer data available to export.");
        }
        return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Generate native Microsoft Excel XML Workbook format (.xls / .xlsx)
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
 <Worksheet ss:Name="Customers">
  <Table>
   <Column ss:Width="120"/>
   <Column ss:Width="160"/>
   <Column ss:Width="220"/>
   <Column ss:Width="140"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="130"/>
   <Column ss:Width="130"/>
   <Column ss:Width="100"/>
   <Column ss:Width="250"/>
   <Row ss:Height="24" ss:StyleID="HeaderStyle">
    <Cell><Data ss:Type="String">Customer ID</Data></Cell>
    <Cell><Data ss:Type="String">Customer Name</Data></Cell>
    <Cell><Data ss:Type="String">Email</Data></Cell>
    <Cell><Data ss:Type="String">Location</Data></Cell>
    <Cell><Data ss:Type="String">Registration Date</Data></Cell>
    <Cell><Data ss:Type="String">Orders Count</Data></Cell>
    <Cell><Data ss:Type="String">Total Spent (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Cancelled Orders</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Delivery Address</Data></Cell>
   </Row>`;

    dataToExport.forEach(c => {
        xml += `
   <Row ss:Height="20">
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(c.id || '')}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(c.name || '')}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(c.email || '')}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(c.location || '')}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(c.regDate || '')}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="Number">${c.ordersCount || 0}</Data></Cell>
    <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${c.totalSpent || 0}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="Number">${c.cancelledCount || 0}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(c.status || '')}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(c.address || '')}</Data></Cell>
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
    link.setAttribute("download", `CloudBasket_Customers_Report_${todayStr}.xls`);
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

function openCustomerModal(customer) {
    const modalOverlay = document.getElementById('cust-modal-overlay');
    if (!modalOverlay) return;

    document.getElementById('modal-cust-name').innerText = customer.name;
    document.getElementById('modal-cust-id').innerText = customer.id;
    document.getElementById('modal-cust-email').innerText = customer.email;
    document.getElementById('modal-cust-location').innerText = customer.location;
    document.getElementById('modal-cust-regdate').innerText = customer.regDate;
    document.getElementById('modal-cust-orders').innerText = customer.ordersCount;
    document.getElementById('modal-cust-spent').innerText = `₹${Number(customer.totalSpent).toLocaleString('en-IN')}`;
    
    const cancelledEl = document.getElementById('modal-cust-cancelled');
    if (cancelledEl) cancelledEl.innerText = customer.cancelledCount || 0;

    document.getElementById('modal-cust-address').innerText = customer.address;

    modalOverlay.classList.add('open');
}
