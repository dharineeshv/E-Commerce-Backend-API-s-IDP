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

    const exportBtn = document.getElementById('exportInventoryExcelBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataToExport = (filteredData && filteredData.length > 0) ? filteredData : combinedInventoryData;
            exportInventoryToExcel(dataToExport);
        });
    }
}

function exportInventoryToExcel(inventoryToExport) {
    if (!inventoryToExport || inventoryToExport.length === 0) {
        alert("No inventory data available to export.");
        return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);

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
 <Worksheet ss:Name="Inventory">
  <Table>
   <Column ss:Width="200"/>
   <Column ss:Width="130"/>
   <Column ss:Width="140"/>
   <Column ss:Width="180"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="130"/>
   <Column ss:Width="120"/>
   <Row ss:Height="24" ss:StyleID="HeaderStyle">
    <Cell><Data ss:Type="String">Product Name</Data></Cell>
    <Cell><Data ss:Type="String">SKU</Data></Cell>
    <Cell><Data ss:Type="String">Category</Data></Cell>
    <Cell><Data ss:Type="String">Warehouse Location</Data></Cell>
    <Cell><Data ss:Type="String">Price (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Available Qty</Data></Cell>
    <Cell><Data ss:Type="String">Reserved Qty</Data></Cell>
    <Cell><Data ss:Type="String">Threshold</Data></Cell>
    <Cell><Data ss:Type="String">Stock Status</Data></Cell>
   </Row>`;

    inventoryToExport.forEach(item => {
        const prod = item.product || {};
        const name = prod.name || item.name || 'Product';
        const sku = item.sku || prod.sku || 'N/A';
        const category = prod.category || 'General';
        const warehouse = item.warehouseLocation || item.warehouse || prod.warehouse || 'Main Warehouse, Shelf A-12';
        const price = prod.price || item.price || 0;
        const avail = item.availableQuantity !== undefined ? item.availableQuantity : (item.quantity || 0);
        const reserved = item.reservedQuantity || item.reserved || 0;
        const threshold = item.lowStockThreshold || item.threshold || 10;

        let statusStr = "In Stock";
        if (avail === 0) statusStr = "Out of Stock";
        else if (avail <= threshold) statusStr = "Low Stock";

        xml += `
   <Row ss:Height="20">
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(name)}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(sku)}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(category)}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(warehouse)}</Data></Cell>
    <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${Number(price)}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="Number">${Number(avail)}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="Number">${Number(reserved)}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="Number">${Number(threshold)}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(statusStr)}</Data></Cell>
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
    link.setAttribute("download", `CloudBasket_Inventory_Report_${todayStr}.xls`);
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
