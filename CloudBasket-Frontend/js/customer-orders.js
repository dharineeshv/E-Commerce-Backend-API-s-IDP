import { API } from "./config.js";
import { apiFetch } from "./api/apiClient.js";

async function init() {
    const listContainer = document.getElementById('customer-orders-list');
    if (!listContainer) return;

    // Render skeleton loaders
    renderSkeletons(listContainer);

    try {
        const response = await apiFetch(`${API.orderService}/api/v1/order`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.status}`);
        }

        const result = await response.json();
        const orders = result.data || result; // Fallback depending on API structure

        if (!orders || orders.length === 0) {
            renderEmpty(listContainer);
        } else {
            // Sort by date (newest first)
            orders.sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt));
            renderOrders(listContainer, orders);
        }

    } catch (error) {
        console.error("Error fetching customer orders:", error);
        renderError(listContainer);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function renderSkeletons(container) {
    let skeletonHtml = '';
    for(let i = 0; i < 3; i++) {
        skeletonHtml += `
            <div class="order-card" style="opacity: 0.7;">
                <div class="order-icon-box" style="background: #e2e8f0;"></div>
                <div class="order-details" style="width: 100%;">
                    <div style="width: 150px; height: 20px; background: #e2e8f0; margin-bottom: 8px; border-radius: 4px;"></div>
                    <div style="width: 100px; height: 24px; background: #e2e8f0; margin-bottom: 8px; border-radius: 4px;"></div>
                    <div style="width: 200px; height: 16px; background: #e2e8f0; border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = skeletonHtml;
}

function renderEmpty(container) {
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="color: #94a3b8; margin-bottom: 20px;">
                <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto; display: block;">
                    <path d="M21 8v13H3V8"></path><path d="M1 3h22v5H1z"></path><path d="M10 12h4"></path>
                </svg>
            </div>
            <h3 style="font-size: 20px; color: #0f172a; margin-bottom: 10px;">No Orders Found</h3>
            <p style="color: #64748b; margin-bottom: 24px;">Looks like you haven't placed any orders yet.</p>
            <button onclick="window.location.href='index.html'" class="btn-solid-orange">Start Shopping</button>
        </div>
    `;
}

function renderError(container) {
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="color: #ef4444; margin-bottom: 20px;">
                <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto; display: block;">
                    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h3 style="font-size: 20px; color: #0f172a; margin-bottom: 10px;">Failed to Load Orders</h3>
            <p style="color: #64748b; margin-bottom: 24px;">There was a problem communicating with our servers. Please try again later.</p>
            <button onclick="location.reload()" class="btn-solid-orange">Retry</button>
        </div>
    `;
}

function renderOrders(container, orders) {
    container.innerHTML = '';
    
    orders.forEach(order => {
        const dateObj = new Date(order.createdAt || order.updatedAt || Date.now());
        const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        
        const numItems = order.items ? order.items.length : 0;
        const itemText = numItems === 1 ? "1 Item" : `${numItems} Items`;
        
        const amount = order.orderTotal || order.totalAmount || order.amount || 0;
        const formattedAmount = '₹' + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const status = order.status || 'PENDING';
        let statusClass = 'status-processing';
        if (status.toUpperCase() === 'DELIVERED') statusClass = 'status-delivered';
        if (status.toUpperCase() === 'CANCELLED') statusClass = 'status-cancelled';
        
        const id = order.orderId || order.id || 'N/A';

        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
            </div>
            <div class="order-details">
                <div class="order-id-row">
                    <span class="order-id">#${id}</span>
                    <span class="status-badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>
                </div>
                <div class="order-price">${formattedAmount}</div>
                <div class="order-meta">Placed on ${formattedDate} • ${itemText}</div>
            </div>
            <div class="order-actions">
                <a href="order-details.html?id=${id}" class="btn-solid-orange" style="text-decoration: none;">View Details</a>
            </div>
        `;
        
        container.appendChild(card);
    });
}
