import { initializeSidebar } from "./sidebar.js";
import { initializeProfileCard } from "./profile.js";
import { initializeLogout } from "./logout.js";
import { initializeHero } from "./hero.js";
import { initializeClock } from "./clock.js";
import { animateCounter } from "./cardAnimation.js";
import { getActiveFestivalSale } from "./api/marketingApi.js";
import { getAllProducts } from "./api/productApi.js";
import { getAllInventory } from "./api/inventoryApi.js";
import { getAllOrders } from "./api/orderApi.js";
import { getAllAdminPayments } from "./api/paymentApi.js";
import { getProfile } from "./api/userProfileApi.js";

async function loadFestivalSale() {

    const response = await getActiveFestivalSale();

    const titleElement = document.getElementById("festival-title");
    const descriptionElement = document.getElementById("festival-description");
    const discountElement = document.getElementById("festival-discount");
    const durationElement = document.getElementById("festival-duration");
    const banner = document.getElementById("festival-banner");

    if (!response || !response.success || !response.data) {
        const festivalStatus = document.getElementById("festival-status");
        if (festivalStatus) {
            festivalStatus.innerHTML = `<span style="font-size: 0.85rem; font-weight: 600; color: #64748b;">No Active Sale</span>`;
        }
        if (titleElement) titleElement.textContent = "No Active Campaign";
        if (descriptionElement) descriptionElement.textContent = "";
        if (discountElement) discountElement.textContent = "--";
        if (durationElement) durationElement.textContent = "--";
        if (banner) banner.src = "../../assets/images/no-festival.png";
        return;
    }

    const festival = response.data;

    const festivalStatus = document.getElementById("festival-status");

    if (festivalStatus) {
        festivalStatus.innerHTML = `<span style="display: block; font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.2; word-break: break-word; overflow-wrap: break-word;" title="${festival.title}">${festival.title}</span><span style="display: inline-block; margin-top: 3px; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">● Active</span>`;
    }

    titleElement.textContent = `${festival.title} Live`;
    descriptionElement.textContent = festival.subtitle || "";
    discountElement.textContent =
        festival.discountType === "PERCENTAGE"
            ? `${festival.discountValue}% OFF`
            : `₹${festival.discountValue} OFF`;

    const startDate = new Date(festival.startDate);
    const endDate = new Date(festival.endDate);

    durationElement.textContent =
        `${startDate.toLocaleDateString("en-IN")} - ${endDate.toLocaleDateString("en-IN")}`;

    banner.src =
        festival.bannerImage ||
        "../../assets/images/no-festival.png";

}

// ===========================================
// Load Product Count
// ===========================================

async function loadProductCount() {

    const response = await getAllProducts();

    if (!response || !response.success) {

        return null;

    }

    animateCounter(

        "total-products",

        response.products.length

    );

    return response.products;

}

function createProductMap(products) {
    const productMap = {};
    (products || []).forEach(product => {
        const id = product.productId || product.id || product.sku;
        if (id) productMap[id] = product;
    });
    return productMap;
}

async function loadInventoryCount(productMap, productsList = []) {
    const inventoryRes = await getAllInventory();

    let inventories = [];
    if (inventoryRes && (inventoryRes.data || inventoryRes.inventory)) {
        inventories = inventoryRes.data || inventoryRes.inventory;
    } else if (Array.isArray(inventoryRes)) {
        inventories = inventoryRes;
    }

    const productCount = Object.keys(productMap || {}).length;
    const inventoryCount = Math.max(inventories.length, productCount);

    animateCounter(
        "inventory-count",
        inventoryCount
    );

    loadLowStockTable(
        inventories,
        productMap,
        productsList
    );
}

async function loadOrders() {
    const tableBody = document.getElementById("recent-orders-body");
    const viewOrdersBtn = document.getElementById("view-all-orders-btn");

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="empty-table">
                Loading...
            </td>
        </tr>
    `;

    const [response, paymentsRes] = await Promise.all([
        getAllOrders(),
        getAllAdminPayments()
    ]);

    let payments = [];
    if (paymentsRes && (paymentsRes.payments || paymentsRes.data || Array.isArray(paymentsRes))) {
        payments = paymentsRes.payments || paymentsRes.data || (Array.isArray(paymentsRes) ? paymentsRes : []);
    }

    const paymentMap = {};
    payments.forEach(p => {
        const pId = p.orderId || p.id;
        if (pId) paymentMap[pId] = p;
    });

    if (!response || (!response.success && !response.data && !Array.isArray(response))) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">
                    No recent orders found.
                </td>
            </tr>
        `;

        if (viewOrdersBtn) {
            viewOrdersBtn.disabled = true;
            viewOrdersBtn.style.opacity = '0.5';
            viewOrdersBtn.style.cursor = 'not-allowed';
            viewOrdersBtn.onclick = null;
        }

        return;
    }

    const rawOrdersList = response.data || response.orders || (Array.isArray(response) ? response : []);
    const count = response.count || rawOrdersList.length;

    // Dashboard Order Count
    animateCounter("today-orders", count);

    const orders = Array.isArray(rawOrdersList) ? rawOrdersList : [];

    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    const todayRevenue = Math.round(orders
        .filter((order) => {
            const status = (order.orderStatus ?? order.status ?? "").toString().toUpperCase();
            const createdAt = order.createdAt || order.createdDate || order.orderDate || "";
            return (
                status !== "CANCELLED" &&
                createdAt.toString().startsWith(todayString)
            );
        })
        .reduce((sum, order) => sum + Number(order.orderTotal ?? order.totalAmount ?? order.amount ?? 0), 0));

    animateCounter("today-revenue", todayRevenue);

    const recentOrders = orders.slice(0, 3);

    if (recentOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">
                    No recent orders found.
                </td>
            </tr>
        `;

        if (viewOrdersBtn) {
            viewOrdersBtn.disabled = true;
            viewOrdersBtn.style.opacity = '0.5';
            viewOrdersBtn.style.cursor = 'not-allowed';
            viewOrdersBtn.onclick = null;
        }

        return;
    }

    if (viewOrdersBtn) {
        viewOrdersBtn.disabled = false;
        viewOrdersBtn.style.opacity = '1';
        viewOrdersBtn.style.cursor = 'pointer';
        viewOrdersBtn.onclick = () => {
            window.location.href = '../../pages/orders/orders.html';
        };
    }

    const rows = await Promise.all(
        recentOrders.map(async (order) => {
            let customerName =
                order.customerName ||
                order.customer?.name ||
                order.customer?.fullName ||
                "";

            if (!customerName && order.customerId) {
                try {
                    const profileResponse = await getProfile(order.customerId);
                    customerName =
                        profileResponse?.data?.fullName ||
                        profileResponse?.fullName ||
                        profileResponse?.data?.name ||
                        profileResponse?.name ||
                        "";
                } catch (error) {
                    console.error("Failed to fetch profile for customer:", order.customerId, error);
                }
            }

            if (!customerName && order.shippingAddress) {
                customerName = `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();
            }
            customerName = customerName || "Unknown Customer";

            const orderIdVal = order.orderId || order.id || "N/A";
            const paymentObj = paymentMap[orderIdVal] || paymentMap[order.orderId] || paymentMap[order.id] || {};

            const orderStatus = (order.orderStatus ?? order.status ?? "PENDING").toUpperCase();
            
            let rawPayStatus = (paymentObj.status || paymentObj.paymentStatus || order.paymentStatus || "").toUpperCase();

            if (!rawPayStatus || rawPayStatus === "PENDING") {
                if (orderStatus === "DELIVERED" || orderStatus === "SHIPPED" || orderStatus === "CONFIRMED" || Number(order.orderTotal || order.totalAmount || 0) > 0) {
                    rawPayStatus = "PAID";
                } else {
                    rawPayStatus = "PENDING";
                }
            }

            const isSuccess = rawPayStatus === "SUCCESS" || rawPayStatus === "PAID" || rawPayStatus === "COMPLETED";
            const payBadgeClass = isSuccess ? "success" : (rawPayStatus === "FAILED" ? "cancelled" : "pending");
            const displayPayStatus = isSuccess ? "PAID" : rawPayStatus;

            return `
                <tr>
                    <td>${customerName}</td>
                    <td>${orderIdVal}</td>
                    <td>₹${Number(order.orderTotal ?? order.totalAmount ?? order.amount ?? order.grandTotal ?? 0).toFixed(2)}</td>
                    <td>
                        <span class="payment-badge ${payBadgeClass}">
                            ${displayPayStatus}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${
                            orderStatus === "DELIVERED"
                                ? "success"
                                : orderStatus === "CANCELLED"
                                ? "cancelled"
                                : "pending"
                        }">
                            ${orderStatus}
                        </span>
                    </td>
                </tr>
            `;
        })

    );

    tableBody.innerHTML = rows.join("");

}

function loadLowStockTable(inventoryList, productMap, allProductsList = []) {
    const tableBody = document.getElementById("low-stock-body");
    const viewInventoryBtn = document.getElementById("view-inventory-btn");

    if (!tableBody) return;
    tableBody.innerHTML = "";

    const items = Array.isArray(inventoryList) ? inventoryList : [];
    const products = Array.isArray(allProductsList) ? allProductsList : Object.values(productMap || {});

    // Create lookup map for inventory items by productId or sku
    const inventoryMap = {};
    items.forEach(inv => {
        const key = inv.productId || inv.product_id || inv.product || inv.sku || inv.inventoryId || inv.id;
        if (key) inventoryMap[key] = inv;
    });

    // Build comprehensive low stock list from products + inventory items
    const lowStockAlerts = [];
    const processedIds = new Set();

    // 1. Process all products
    products.forEach(p => {
        const pId = p.productId || p.id || p.sku;
        if (!pId || processedIds.has(pId)) return;
        processedIds.add(pId);

        const inv = inventoryMap[pId] || (p.sku ? inventoryMap[p.sku] : null);
        const qty = Number(
            inv?.availableQuantity ?? 
            inv?.quantity ?? 
            p.availableQuantity ?? 
            p.stock ?? 
            p.quantity ?? 
            p.stockQuantity ?? 
            (p.inStock === false ? 0 : 5)
        );

        const isExplicitlyOut = p.inStock === false || (p.status && (p.status.toUpperCase() === 'OUT_OF_STOCK' || p.status.toUpperCase() === 'INACTIVE'));
        const isLowStock = qty <= 10 || isExplicitlyOut || (p.stockStatus === 'low_stock');

        if (isLowStock) {
            lowStockAlerts.push({
                id: pId,
                name: p.name || p.title || inv?.productName || ("Product " + pId),
                qty: Math.max(0, qty),
                isOutOfStock: isExplicitlyOut || qty <= 0
            });
        }
    });

    // 2. Process standalone inventory items not in products list
    items.forEach(inv => {
        const invId = inv.productId || inv.product_id || inv.product || inv.inventoryId || inv.id;
        if (!invId || processedIds.has(invId)) return;
        processedIds.add(invId);

        const qty = Number(inv.availableQuantity ?? inv.quantity ?? inv.stock ?? 0);
        if (qty <= 10) {
            lowStockAlerts.push({
                id: invId,
                name: inv.productName || inv.name || (productMap[invId]?.name) || ("Product " + invId),
                qty: Math.max(0, qty),
                isOutOfStock: qty <= 0
            });
        }
    });

    if (lowStockAlerts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table" style="text-align: center; padding: 24px; color: #64748b; font-size: 0.9rem;">
                    No low stock alerts.
                </td>
            </tr>
        `;

        if (viewInventoryBtn) {
            viewInventoryBtn.disabled = true;
            viewInventoryBtn.style.opacity = '0.5';
            viewInventoryBtn.style.cursor = 'not-allowed';
            viewInventoryBtn.onclick = null;
        }
        return;
    }

    if (viewInventoryBtn) {
        viewInventoryBtn.disabled = false;
        viewInventoryBtn.style.opacity = '1';
        viewInventoryBtn.style.cursor = 'pointer';
        viewInventoryBtn.onclick = () => {
            window.location.href = '../../pages/inventory/inventory.html';
        };
    }

    // Render low stock rows
    tableBody.innerHTML = lowStockAlerts.map(item => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; font-weight: 600; color: #1e293b; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${item.name}
            </td>
            <td style="padding: 12px; font-weight: 700; color: ${item.isOutOfStock ? '#dc2626' : '#d97706'};">
                ${item.qty} units
            </td>
            <td style="padding: 12px;">
                ${item.isOutOfStock 
                    ? '<span class="status-badge out" style="background:#fef2f2; color:#dc2626; border:1px solid #fecaca; padding:3px 10px; border-radius:12px; font-size:0.75rem; font-weight:700;">Out of Stock</span>'
                    : '<span class="status-badge low" style="background:#fff7ed; color:#d97706; border:1px solid #fed7aa; padding:3px 10px; border-radius:12px; font-size:0.75rem; font-weight:700;">Low Stock</span>'
                }
            </td>
        </tr>
    `).join('');
}

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        initializeSidebar();

        initializeProfileCard();

        initializeLogout();

        initializeHero();

        initializeClock();

        loadFestivalSale();

        const products = await loadProductCount();
        const productMap = createProductMap(products || []);
        await loadInventoryCount(productMap, products || []);
        await loadOrders();

    }

);
