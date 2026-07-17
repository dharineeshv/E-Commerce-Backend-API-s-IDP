import { getAllOrders } from '../api/orderApi.js';

export async function fetchAndLoadOrders() {
    const response = await getAllOrders();
    if (response && response.success && response.data) {
        state.allOrders = response.data.map(order => {
            const dateObj = new Date(order.createdAt || order.updatedAt || Date.now());
            
            // Safe fallbacks for nested properties
            const shipping = order.shippingAddress || {};
            const customerName = shipping.fullName || "Unknown Customer";
            const customerEmail = shipping.email || "No Email";
            
            // Generate avatar initials
            const initials = customerName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
            
            // Items
            const items = order.items || [];
            const productName = items.length > 0 ? items[0].name || items[0].productId : "Unknown Product";
            
            return {
                id: order.orderId,
                customerName,
                customerEmail,
                customerAvatar: initials || "U",
                amount: order.totalAmount || 0,
                status: order.status || "PENDING",
                paymentStatus: order.paymentStatus || "Pending",
                paymentMethod: order.paymentMethod || "Credit Card",
                date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                rawDate: dateObj.toISOString(),
                productName: items.length > 1 ? `${productName} +${items.length - 1}` : productName,
                // store raw data for modals
                _raw: order 
            };
        });
        
        // Sort by date descending
        state.allOrders.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
    } else {
        state.allOrders = [];
    }
    
    state.filteredOrders = [...state.allOrders];
    applyFilters();
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
    state.filteredOrders = state.allOrders.filter(order => {
        // Search
        const searchTerm = state.filters.search.toLowerCase();
        const matchesSearch = 
            order.id.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.customerEmail.toLowerCase().includes(searchTerm) ||
            order.productName.toLowerCase().includes(searchTerm);

        // Filters
        const matchesStatus = !state.filters.status || order.status === state.filters.status;
        const matchesPaymentStatus = !state.filters.paymentStatus || order.paymentStatus === state.filters.paymentStatus;
        const matchesPaymentMethod = !state.filters.paymentMethod || order.paymentMethod === state.filters.paymentMethod;
        
        // Date formatting match (simple implementation)
        let matchesDate = true;
        if (state.filters.date) {
            const filterDate = new Date(state.filters.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            matchesDate = order.date === filterDate;
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
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return state.filteredOrders.slice(startIndex, endIndex);
}

export function getTotalPages() {
    return Math.ceil(state.filteredOrders.length / state.itemsPerPage);
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
    const total = state.filteredOrders.length;
    const pending = state.filteredOrders.filter(o => o.status === "Pending" || o.status === "Processing" || o.status === "Confirmed").length;
    const shipped = state.filteredOrders.filter(o => o.status === "Shipped").length;
    const delivered = state.filteredOrders.filter(o => o.status === "Delivered").length;
    const cancelled = state.filteredOrders.filter(o => o.status === "Cancelled").length;
    
    const today = new Date(2023, 9, 24).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); // Mock today
    const todayRev = state.filteredOrders
        .filter(o => o.date === today && o.paymentStatus === "Paid")
        .reduce((sum, o) => sum + o.amount, 0);

    return { total, pending, shipped, delivered, cancelled, todayRev };
}
