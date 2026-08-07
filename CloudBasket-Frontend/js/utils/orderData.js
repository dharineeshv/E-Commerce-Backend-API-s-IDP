import { getAllOrders } from '../api/orderApi.js';
import { getAllAdminPayments } from '../api/paymentApi.js';
import { getProfile } from '../api/userProfileApi.js';

export async function fetchAndLoadOrders() {
    const [ordersRes, paymentsRes] = await Promise.all([
        getAllOrders(),
        getAllAdminPayments()
    ]);

    let payments = [];
    if (paymentsRes && paymentsRes.success && paymentsRes.payments) {
        payments = paymentsRes.payments;
    }

    // Create a map for fast lookup
    const paymentMap = {};
    payments.forEach(p => {
        if (p.orderId) paymentMap[p.orderId] = p;
    });

    const missingEmailCustomerIds = new Set();
    const rawOrders = ordersRes ? (ordersRes.data || ordersRes.orders || (Array.isArray(ordersRes) ? ordersRes : [])) : [];

    if (Array.isArray(rawOrders) && rawOrders.length > 0) {
        rawOrders.forEach(order => {
            const shipping = order.shippingAddress || {};
            const customerEmail = shipping.email || shipping.customerEmail;
            if ((!customerEmail || customerEmail === "customer@example.com") && order.customerId) {
                missingEmailCustomerIds.add(order.customerId);
            }
        });
        
        let profileMap = {};
        try {
            const profiles = await Promise.all([...missingEmailCustomerIds].map(id => getProfile(id)));
            profiles.forEach(p => {
                if (p && (p.success || p.data) && (p.data || p)) {
                    const data = p.data || p;
                    if (data.customerId) profileMap[data.customerId] = data.email;
                }
            });
        } catch(e) {}

        state.allOrders = rawOrders.map(order => {
            const dateObj = new Date(order.createdAt || order.updatedAt || Date.now());
            
            // Safe fallbacks for nested properties
            const shipping = order.shippingAddress || {};
            let customerEmail = shipping.email || shipping.customerEmail;
            
            // Fix for older orders that had the hardcoded placeholder
            if (!customerEmail || customerEmail === "customer@example.com") {
                customerEmail = profileMap[order.customerId] || "No Email";
            }
            if (customerEmail === "google-sso-user@example.com" || customerEmail === "Google SSO User") {
                const mapEmail = profileMap[order.customerId];
                customerEmail = (mapEmail && mapEmail !== "google-sso-user@example.com") 
                    ? mapEmail 
                    : `customer_${String(order.customerId || '001').replace(/^cust-/i, '')}@cloudbasket.com`;
            }
            
            // As requested, use customer email alone in the customer field
            const customerName = customerEmail;
            
            // Generate avatar initials from email
            let initials = "U";
            if (customerEmail && customerEmail !== "No Email") {
                initials = customerEmail.substring(0, 2).toUpperCase();
            }
            
            // Items
            const items = order.items || [];
            const productName = items.length > 0 ? (items[0].name || items[0].productName || items[0].title || items[0].productId || "Product") : "Unknown Product";
            
            const orderIdVal = order.orderId || order.id || order._id || 'ORD-UNKNOWN';
            const payment = paymentMap[orderIdVal] || paymentMap[order.orderId] || paymentMap[order.id] || {};

            return {
                id: orderIdVal,
                customerName,
                customerEmail,
                customerAvatar: initials,
                amount: Number(order.orderTotal || order.totalAmount || order.amount || 0),
                status: (() => {
                    const s = order.status || "PENDING";
                    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                })(),
                paymentStatus: payment.status || order.paymentStatus || "Pending",
                paymentMethod: payment.paymentMethod || order.paymentMethod || "Credit Card",
                date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                rawDate: dateObj.toISOString(),
                productName: items.length > 1 ? `${productName} +${items.length - 1}` : productName,
                // store raw data for modals
                _raw: order 
            };
        });
        
        // Apply mocked statuses
        const mockedStatuses = JSON.parse(localStorage.getItem('mockedOrderStatuses') || '{}');
        state.allOrders.forEach(o => {
            if (mockedStatuses[o.id]) {
                o.status = mockedStatuses[o.id];
            }
        });
        
        // Sort by date descending
        state.allOrders.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
    } else {
        state.allOrders = [];
    }
    
    state.filteredOrders = [...state.allOrders];
    applyFilters();

    // Safety fallback: If active filters filtered out everything on load, show all orders
    const hasActiveFilters = Object.values(state.filters).some(v => v !== "");
    if (!hasActiveFilters && state.filteredOrders.length === 0 && state.allOrders.length > 0) {
        state.filteredOrders = [...state.allOrders];
    }
}

// State
export const state = {
    allOrders: [],
    filteredOrders: [],
    currentPage: 1,
    itemsPerPage: 8,
    filters: {
        search: "",
        status: "",
        paymentStatus: "",
        paymentMethod: "",
        date: ""
    }
};

// Filter & Search Logic
export function applyFilters() {
    const searchTerm = (state.filters.search || "").trim().toLowerCase();

    state.filteredOrders = state.allOrders.filter(order => {
        if (!order) return false;

        // 1. Search
        const orderId = String(order.id || "").toLowerCase();
        const custName = String(order.customerName || "").toLowerCase();
        const custEmail = String(order.customerEmail || "").toLowerCase();
        const prodName = String(order.productName || "").toLowerCase();

        const matchesSearch = !searchTerm || 
            orderId.includes(searchTerm) ||
            custName.includes(searchTerm) ||
            custEmail.includes(searchTerm) ||
            prodName.includes(searchTerm);

        // 2. Status Filter
        const filterStatus = (state.filters.status || "").trim().toLowerCase();
        const orderStatus = String(order.status || "").toLowerCase();
        const matchesStatus = !filterStatus || orderStatus === filterStatus;

        // 3. Payment Status Filter
        const filterPaymentStatus = (state.filters.paymentStatus || "").trim().toLowerCase();
        const orderPaymentStatus = String(order.paymentStatus || "").toLowerCase();
        const matchesPaymentStatus = !filterPaymentStatus || orderPaymentStatus === filterPaymentStatus;

        // 4. Payment Method Filter
        const filterPaymentMethod = (state.filters.paymentMethod || "").trim().toLowerCase();
        const orderPaymentMethod = String(order.paymentMethod || "").toLowerCase();
        const matchesPaymentMethod = !filterPaymentMethod || 
            orderPaymentMethod === filterPaymentMethod ||
            orderPaymentMethod.replace(/_/g, ' ') === filterPaymentMethod.replace(/_/g, ' ') ||
            filterPaymentMethod.includes(orderPaymentMethod) ||
            orderPaymentMethod.includes(filterPaymentMethod);
        
        // 5. Date Filter
        let matchesDate = true;
        if (state.filters.date) {
            try {
                const filterDate = new Date(state.filters.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                matchesDate = order.date === filterDate;
            } catch (e) {
                matchesDate = true;
            }
        }

        return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMethod && matchesDate;
    });

    // Reset to page 1 on filter
    state.currentPage = 1;
}

export function updateFilterState(key, value) {
    state.filters[key] = value;
    applyFilters();
}

export function clearFilters() {
    state.filters = {
        search: "",
        status: "",
        paymentStatus: "",
        paymentMethod: "",
        date: ""
    };
    applyFilters();
}

// Pagination Logic
export function getPaginatedOrders() {
    const totalPages = getTotalPages();
    if (state.currentPage > totalPages && totalPages > 0) {
        state.currentPage = 1;
    }
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return state.filteredOrders.slice(startIndex, endIndex);
}

export function getTotalPages() {
    const pages = Math.ceil(state.filteredOrders.length / state.itemsPerPage);
    return pages > 0 ? pages : 1;
}

export function goToPage(page) {
    const totalPages = getTotalPages();
    if (page >= 1 && page <= totalPages) {
        state.currentPage = page;
        return true;
    }
    return false;
}

// Stats Logic
export function getStats() {
    const total = state.allOrders.length;
    const pending = state.allOrders.filter(o => {
        const s = (o.status || "").toLowerCase();
        return s === "pending" || s === "processing" || s === "confirmed";
    }).length;
    const shipped = state.allOrders.filter(o => (o.status || "").toLowerCase() === "shipped").length;
    const delivered = state.allOrders.filter(o => (o.status || "").toLowerCase() === "delivered").length;
    const cancelled = state.allOrders.filter(o => (o.status || "").toLowerCase() === "cancelled").length;
    
    // Revenue from all orders
    const todayRev = state.allOrders
        .filter(o => {
            const ps = (o.paymentStatus || "").toLowerCase();
            return ps === "paid" || ps === "completed" || ps === "success";
        })
        .reduce((sum, o) => sum + Number(o.amount || 0), 0);

    return { total, pending, shipped, delivered, cancelled, todayRev };
}
