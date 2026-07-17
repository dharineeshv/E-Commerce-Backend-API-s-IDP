import { getPaginatedOrders, getTotalPages, state, goToPage } from './orderData.js';

export function renderOrdersTable() {
    const tbody = document.getElementById('orders-table-body');
    const orders = getPaginatedOrders();

    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem; color: #64748b;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1rem; opacity: 0.5;">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <p style="font-size: 1.1rem; font-weight: 500;">No Orders Found</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Try adjusting your search or filters.</p>
                </td>
            </tr>
        `;
        renderPagination();
        return;
    }

    tbody.innerHTML = '';

    orders.forEach(order => {
        const tr = document.createElement('tr');
        
        // Avatar color class
        const colors = ['bg-blue', 'bg-green', 'bg-purple', 'bg-orange'];
        const colorClass = colors[order.customerName.length % colors.length];

        // Status badge class
        const statusClass = order.status.toLowerCase();
        
        // Payment badge class
        const payClass = order.paymentStatus.toLowerCase();

        tr.innerHTML = `
            <td>
                <button class="view-icon-btn" data-id="${order.id}" title="View Order">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </td>
            <td><strong>${order.id}</strong></td>
            <td>
                <div class="customer-cell">
                    <div class="avatar-sm ${colorClass}">${order.customerAvatar}</div>
                    <div>
                        <div class="customer-name-sm">${order.customerName}</div>
                        <div class="customer-email-sm">${order.customerEmail}</div>
                    </div>
                </div>
            </td>
            <td class="amount-text">₹${order.amount.toFixed(2)}</td>
            <td>
                <span class="badge-payment ${payClass}">${order.paymentStatus}</span>
            </td>
            <td>
                <span class="badge-status ${statusClass}">${order.status}</span>
            </td>
            <td>${order.date}</td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination();
}

export function renderPagination() {
    const infoEl = document.getElementById('pagination-info');
    const controlsEl = document.getElementById('pagination-controls');

    const totalOrders = state.filteredOrders.length;
    const totalPages = getTotalPages();
    
    // Info text
    if (totalOrders === 0) {
        infoEl.textContent = 'Showing 0 to 0 of 0 orders';
        controlsEl.innerHTML = '';
        return;
    }

    const startIdx = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endIdx = Math.min(state.currentPage * state.itemsPerPage, totalOrders);
    infoEl.textContent = `Showing ${startIdx} to ${endIdx} of ${totalOrders} orders`;

    // Controls
    let html = '';
    
    // Prev
    html += `<button class="page-btn" data-page="${state.currentPage - 1}" ${state.currentPage === 1 ? 'disabled' : ''}>Previous</button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        // Simple logic for small number of pages, could be enhanced with ellipses for many pages
        if (totalPages <= 5 || i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
            html += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (i === 2 && state.currentPage > 3) {
            html += `<span style="padding: 0 0.5rem;">...</span>`;
        } else if (i === totalPages - 1 && state.currentPage < totalPages - 2) {
            html += `<span style="padding: 0 0.5rem;">...</span>`;
        }
    }

    // Next
    html += `<button class="page-btn" data-page="${state.currentPage + 1}" ${state.currentPage === totalPages ? 'disabled' : ''}>Next</button>`;

    controlsEl.innerHTML = html;
}

export function renderStats(stats) {
    document.getElementById('stat-total-orders').textContent = stats.total.toLocaleString();
    document.getElementById('stat-pending-orders').textContent = stats.pending.toLocaleString();
    document.getElementById('stat-shipped-orders').textContent = stats.shipped.toLocaleString();
    document.getElementById('stat-delivered-orders').textContent = stats.delivered.toLocaleString();
    document.getElementById('stat-cancelled-orders').textContent = stats.cancelled.toLocaleString();
    document.getElementById('stat-today-revenue').textContent = '₹' + stats.todayRev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}
