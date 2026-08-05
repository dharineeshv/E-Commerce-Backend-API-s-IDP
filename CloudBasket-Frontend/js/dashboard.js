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

    products.forEach(product => {

        console.log("Product Object:", product);

        console.log("Product ID:", product.productId);

        console.log("Product Name:", product.name);

        productMap[product.productId] = product;

    });

    console.log("Final Product Map:", productMap);

    return productMap;

}

async function loadInventoryCount(productMap) {
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
        productMap
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

    const todayRevenue = orders
        .filter((order) => {
            const status = (order.orderStatus ?? order.status ?? "").toString().toUpperCase();
            const createdAt = order.createdAt || order.createdDate || order.orderDate || "";
            return (
                status !== "CANCELLED" &&
                createdAt.toString().startsWith(todayString)
            );
        })
        .reduce((sum, order) => sum + Number(order.orderTotal ?? order.totalAmount ?? order.amount ?? 0), 0);

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

function loadLowStockTable(

    inventoryList,

    productMap

){

    const tableBody =

        document.getElementById("low-stock-body");
    const viewInventoryBtn = document.getElementById("view-inventory-btn");

    tableBody.innerHTML = "";

    const items = Array.isArray(inventoryList) ? inventoryList : [];

    const lowStockProducts =

    items.filter(item =>

        (item.availableQuantity ?? item.quantity) <= 10

    );

    if (!inventoryList || items.length === 0 || lowStockProducts.length === 0) {

        tableBody.innerHTML =

        `
            <tr>

                <td colspan="4" class="empty-table">

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

    lowStockProducts.forEach(item => {
        console.log("----------------");

console.log("Inventory Product ID:", item.productId);

console.log("Matched Product:", productMap[item.productId]);

        tableBody.innerHTML +=

        `
            <tr>

                <td>

                    ${
    productMap[item.productId]?.name ||
    "Unknown Product"
}
                </td>

                <td>

                    ${item.productId}

                </td>

                <td>

                   ${item.availableQuantity ?? item.quantity}

                </td>

                <td>

                    <span class="status-badge low">

                        Low Stock

                    </span>

                </td>

            </tr>
        `;

    });

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

const productMap = createProductMap(

    products || []

);

        await loadInventoryCount(productMap);
        await loadOrders();

    }

);
