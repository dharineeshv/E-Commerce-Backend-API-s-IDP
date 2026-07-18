import { initializeSidebar } from "./sidebar.js";
import { initializeProfileCard } from "./profile.js";
import { initializeLogout } from "./logout.js";

import { getAllInventory } from "./api/inventoryApi.js";
import { getAllProducts, getProductById } from "./api/productApi.js";

import { showSkeletons, hideSkeletons } from "./utils/inventoryLoader.js";
import { renderInventoryTable } from "./utils/renderInventory.js";
import { updateInventoryStats } from "./utils/inventoryStats.js";
import { setupModals } from "./utils/inventoryModals.js";

let combinedInventoryData = [];
let filteredData = [];

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize Common Layout Elements
    initializeSidebar();
    initializeProfileCard();
    initializeLogout();

    // Show skeletons immediately
    showSkeletons();

    // Fetch data
    await loadInventoryPageData();

    // Setup Custom Dropdown Filter & Search
    setupFilters();
});

async function loadInventoryPageData() {
    try {
        const [inventoryRes, productRes] = await Promise.all([
            getAllInventory(),
            getAllProducts()
        ]);

        let inventories = [];
        let products = [];

        if (inventoryRes && inventoryRes.success) {
            inventories = inventoryRes.data || [];
        } else if (Array.isArray(inventoryRes)) {
            inventories = inventoryRes;
        }

        if (productRes && productRes.success) {
            products = productRes.products || productRes.data || [];
        } else if (Array.isArray(productRes)) {
            products = productRes;
        }

        // Create a lookup for products
        const productMapById = {};
        const productMapBySku = {};
        products.forEach(p => {
            const id = p.productId || p.id || p._id;
            const sku = p.sku;
            if (id) productMapById[id] = p;
            if (sku) productMapBySku[sku] = p;
        });

        // Combine
        combinedInventoryData = inventories.map(inv => {
            const idToMatch = inv.productId || inv.product_id || inv.product || inv._id;
            let prod = productMapById[idToMatch];
            
            if (!prod && inv.sku) {
                prod = productMapBySku[inv.sku];
            }
            if (!prod) {
                prod = {};
            }
            return {
                ...inv,
                product: prod,
                missingProductId: (!prod.name && idToMatch) ? idToMatch : null
            };
        });

        // Filter out orphaned inventory records (where product was deleted)
        combinedInventoryData = combinedInventoryData.filter(inv => inv.product && inv.product.name);

        filteredData = [...combinedInventoryData];

        // Hide Skeletons and render
        hideSkeletons();
        updateInventoryStats(combinedInventoryData);
        renderInventoryTable(filteredData);
        setupModals(combinedInventoryData, loadInventoryPageData);

    } catch (error) {
        console.error("Failed to load inventory page data:", error);
        hideSkeletons();
        renderInventoryTable([]);
    }
}

function setupFilters() {
    const searchInput = document.querySelector('.search-wrapper input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            applyFilters(e.target.value.toLowerCase(), null);
        });
    }

    const dropdownBtn = document.getElementById('stockStatusBtn');
    const dropdownList = document.getElementById('stockStatusList');
    const selectedText = dropdownBtn ? dropdownBtn.querySelector('.dropdown-text') : null;

    let currentStatusFilter = "";

    if (dropdownBtn && dropdownList && selectedText) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownList.classList.toggle('show');
        });

        document.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', () => {
                selectedText.textContent = option.textContent.trim();
                currentStatusFilter = option.dataset.value;
                dropdownList.classList.remove('show');
                
                const searchVal = searchInput ? searchInput.value.toLowerCase() : "";
                applyFilters(searchVal, currentStatusFilter);
            });
        });

        document.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target) && !dropdownList.contains(e.target)) {
                dropdownList.classList.remove('show');
            }
        });
    }
}

function applyFilters(searchTerm, statusFilter) {
    filteredData = combinedInventoryData.filter(item => {
        const prod = item.product || {};
        const name = (prod.name || "").toLowerCase();
        const sku = (item.sku || prod.sku || "").toLowerCase();
        const brand = (prod.brand || "").toLowerCase();
        const category = (prod.category || "").toLowerCase();

        const matchesSearch = !searchTerm || 
            name.includes(searchTerm) || 
            sku.includes(searchTerm) || 
            brand.includes(searchTerm) || 
            category.includes(searchTerm);

        let matchesStatus = true;
        if (statusFilter) {
            const avail = item.availableQuantity || item.quantity || 0;
            const threshold = item.lowStockThreshold || item.threshold || 10;
            
            if (statusFilter === "in_stock") {
                matchesStatus = avail > threshold;
            } else if (statusFilter === "low_stock") {
                matchesStatus = avail > 0 && avail <= threshold;
            } else if (statusFilter === "out_of_stock") {
                matchesStatus = avail === 0;
            }
        }

        return matchesSearch && matchesStatus;
    });

    renderInventoryTable(filteredData);
}
