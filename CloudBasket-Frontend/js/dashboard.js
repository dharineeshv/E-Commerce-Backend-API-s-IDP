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
import { getProfile } from "./api/userProfileApi.js";

async function loadFestivalSale() {

    const response = await getActiveFestivalSale();

    const titleElement = document.getElementById("festival-title");
    const descriptionElement = document.getElementById("festival-description");
    const discountElement = document.getElementById("festival-discount");
    const durationElement = document.getElementById("festival-duration");
    const banner = document.getElementById("festival-banner");

    if (!response || !response.success || !response.data) {

        titleElement.textContent = "No Active Campaign";
        descriptionElement.textContent = "";
        discountElement.textContent = "--";
        durationElement.textContent = "--";
        banner.src = "../../assets/images/no-festival.png";
        return;

    }

    const festival = response.data;

    const festivalStatus = document.getElementById("festival-status");

if (festivalStatus) {

    festivalStatus.textContent = `${festival.title} Live`;

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

    const inventory = await getAllInventory();

    if (!inventory) {

        return;

    }

    animateCounter(

        "inventory-count",

        inventory.length

    );

    loadLowStockTable(

        inventory,

        productMap

    );

}

async function loadOrders() {

    const tableBody =
        document.getElementById("recent-orders-body");

    tableBody.innerHTML = `

        <tr>

            <td colspan="5" class="empty-table">

                Loading...

            </td>

        </tr>

    `;

    const response = await getAllOrders();

    if (!response || !response.success) {

        tableBody.innerHTML = `

            <tr>

                <td colspan="5" class="empty-table">

                    No recent orders found.

                </td>

            </tr>

        `;

        return;

    }

    // Dashboard Order Count
    animateCounter(

        "today-orders",

        response.count

    );

    const orders = Array.isArray(response.data)
        ? response.data
        : [];

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
        .reduce((sum, order) => sum + Number(order.orderTotal ?? 0), 0);

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

        return;

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

                console.log("Order:", order);

const profileResponse = await getProfile(order.customerId);

console.log("Profile Response:", profileResponse);

customerName =
    profileResponse?.data?.fullName ||
    profileResponse?.fullName ||
    profileResponse?.data?.name ||
    profileResponse?.name ||
    "";

                }

                catch (error) {

                    console.error(

                        "Failed to fetch profile for customer:",

                        order.customerId,

                        error

                    );

                }

            }

            if (!customerName && order.shippingAddress) {
                customerName = `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();
            }
            customerName = customerName || "Unknown Customer";

            const paymentStatus =
                (order.paymentStatus ?? "PENDING").toUpperCase();

            const orderStatus =
                (order.orderStatus ?? order.status ?? "PENDING").toUpperCase();

            return `

                <tr>

                    <td>${customerName}</td>

                    <td>${order.orderId ?? "N/A"}</td>

                    <td>₹${order.orderTotal ?? order.totalAmount ?? order.amount ?? order.grandTotal ?? 0}</td>

                    <td>

                        <span class="payment-badge ${

                            paymentStatus === "SUCCESS"

                                ? "success"

                                : "pending"

                        }">

                            ${paymentStatus}

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

    tableBody.innerHTML = "";

    const lowStockProducts =

    inventoryList.filter(item =>

        (item.availableQuantity ?? item.quantity) <= 10

    );

    if (lowStockProducts.length === 0) {

        tableBody.innerHTML =

        `
            <tr>

                <td colspan="4" class="empty-table">

                    No low stock alerts.

                </td>

            </tr>
        `;

        return;

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
