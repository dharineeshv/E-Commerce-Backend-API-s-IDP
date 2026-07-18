import { applyFilters, updateFilterState, clearFilters, getStats, goToPage, state, fetchAndLoadOrders } from './utils/orderData.js';
import { renderOrdersTable, renderStats } from './utils/renderOrders.js';
import { initModals, openViewModal, handleUpdateStatus, handleAssignShipment } from './utils/orderModals.js';
import { initializeLogout } from './logout.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial Render Loading State
    renderSkeleton();

    // 2. Fetch from Backend
    try {
        await fetchAndLoadOrders();
    } catch (e) {
        console.error("Failed to load orders", e);
        renderError();
        return;
    }
    
    // 3. Render Table
    renderAll();
    initModals();
    initializeLogout();

    // 2. Setup Event Listeners for Filters
    setupFilters();

    // 3. Setup Pagination Listeners
    setupPagination();

    // 4. Setup Table Row Listeners (View Modal)
    setupTableListeners();

    // 5. (Removed duplicate Sub-modal Logic Listeners)
    
    // 6. Header/Sidebar Basic Logic
    setupLayoutLogic();

    // 7. Listen for order updates from modals to re-render the table
    document.addEventListener('orders-updated', async () => {
        try {
            await fetchAndLoadOrders();
            renderAll();
        } catch (e) {
            console.error("Failed to reload orders", e);
        }
    });

    document.addEventListener('local-orders-updated', () => {
        applyFilters();
        renderAll();
    });
});

function renderAll() {
    if (state.allOrders.length === 0) {
        renderEmpty();
    } else {
        renderOrdersTable();
    }
    renderStats(getStats());
}

function renderSkeleton() {
    const tbody = document.getElementById('orders-table-body');
    let skeletonHtml = '';
    for(let i=0; i<8; i++) {
        skeletonHtml += `
            <tr>
                <td colspan="7">
                    <div style="width: 100%; height: 40px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px;"></div>
                </td>
            </tr>
        `;
    }
    tbody.innerHTML = skeletonHtml;
    // Add inline keyframes if not present
    if (!document.getElementById('skeleton-styles')) {
        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.innerHTML = `@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`;
        document.head.appendChild(style);
    }
}

function renderError() {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px;">
                <div style="color: #ef4444; margin-bottom: 10px;">
                    <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin:0 auto; display:block;">
                        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3>Failed to load orders</h3>
                <p style="color: #64748b; margin-top: 5px;">There was a problem connecting to the backend.</p>
                <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
            </td>
        </tr>
    `;
}

function renderEmpty() {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px;">
                <div style="color: #94a3b8; margin-bottom: 10px;">
                    <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin:0 auto; display:block;">
                        <path d="M21 8v13H3V8"></path><path d="M1 3h22v5H1z"></path><path d="M10 12h4"></path>
                    </svg>
                </div>
                <h3>No orders found</h3>
                <p style="color: #64748b; margin-top: 5px;">There are no orders matching your criteria.</p>
            </td>
        </tr>
    `;
}

function setupFilters() {
    // Search
    const searchInput = document.getElementById('orderSearch');
    searchInput.addEventListener('input', (e) => {
        updateFilterState('search', e.target.value);
        renderAll();
    });

    // Dropdowns
    const filterStatus = document.getElementById('filterStatus');
    filterStatus.addEventListener('change', (e) => {
        updateFilterState('status', e.target.value);
        renderAll();
    });

    const filterPaymentStatus = document.getElementById('filterPaymentStatus');
    filterPaymentStatus.addEventListener('change', (e) => {
        updateFilterState('paymentStatus', e.target.value);
        renderAll();
    });

    const filterPaymentMethod = document.getElementById('filterPaymentMethod');
    filterPaymentMethod.addEventListener('change', (e) => {
        updateFilterState('paymentMethod', e.target.value);
        renderAll();
    });

    // Date
    const filterDate = document.getElementById('filterDate');
    filterDate.addEventListener('change', (e) => {
        updateFilterState('date', e.target.value);
        renderAll();
    });

    // Clear
    const clearBtn = document.getElementById('clearFiltersBtn');
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterStatus.value = '';
        filterPaymentStatus.value = '';
        filterPaymentMethod.value = '';
        filterDate.value = '';
        clearFilters();
        renderAll();
    });
}

function setupPagination() {
    const controlsContainer = document.getElementById('pagination-controls');
    controlsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('page-btn') && !e.target.disabled) {
            const page = parseInt(e.target.dataset.page);
            if (goToPage(page)) {
                renderOrdersTable();
                // Optionally scroll to top of table
                document.querySelector('.orders-table-wrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
}

function setupTableListeners() {
    const tbody = document.getElementById('orders-table-body');
    tbody.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.view-icon-btn');
        if (viewBtn) {
            const orderId = viewBtn.dataset.id;
            openViewModal(orderId);
        }
    });
}

function setupSubModalLogic() {
    // When status updates, re-render table and stats
    handleUpdateStatus(() => {
        renderAll();
    });

    handleAssignShipment();
}

function setupLayoutLogic() {
    // Sidebar Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Profile Dropdown Dummy
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileCard = document.getElementById('profile-card');
    if (profileDropdown && profileCard) {
        profileDropdown.addEventListener('click', () => {
            profileCard.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-section') && !e.target.closest('.profile-card')) {
                profileCard.classList.remove('show');
            }
        });
    }

    // Admin info fallback
    document.getElementById('profile-full-name').textContent = "Dharineesh V";
    document.getElementById('profile-email').textContent = "admin@cloudbasket.com";
    document.getElementById('profile-phone').textContent = "+1 234 567 8900";
    document.getElementById('profile-username').textContent = "dharineesh.admin";
}
