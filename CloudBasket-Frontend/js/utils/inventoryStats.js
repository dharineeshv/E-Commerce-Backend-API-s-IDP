import { animateCounter } from "../cardAnimation.js";

export function updateInventoryStats(inventoryItems) {
    if (!inventoryItems || !Array.isArray(inventoryItems)) return;

    let totalProducts = inventoryItems.length;
    let totalUnits = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;
    let recentlyUpdated = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    inventoryItems.forEach(item => {
        const product = item.product || {};
        const avail = item.availableQuantity || item.quantity || 0;
        const resv = item.reservedQuantity || item.reserved || 0;
        const threshold = item.lowStockThreshold || item.threshold || 10;
        const price = product.sellingPrice || product.price || 0;
        
        totalUnits += (avail + resv);
        totalValue += (avail * price);

        if (avail === 0) {
            outOfStock++;
        } else if (avail <= threshold) {
            lowStock++;
        }

        const updatedStr = item.lastUpdated || item.updatedAt;
        if (updatedStr) {
            const updatedDate = new Date(updatedStr);
            if (updatedDate >= today) {
                recentlyUpdated++;
            }
        }
    });

    animateCounter("stat-total-products", totalProducts);
    
    // Formatting total units
    const formattedUnits = totalUnits >= 1000000 
        ? (totalUnits / 1000000).toFixed(1) + 'M' 
        : totalUnits >= 1000 
            ? (totalUnits / 1000).toFixed(1) + 'k' 
            : totalUnits;
            
    const unitsEl = document.getElementById("stat-total-units");
    if (unitsEl) unitsEl.textContent = formattedUnits;

    animateCounter("stat-low-stock", lowStock);
    animateCounter("stat-out-of-stock", outOfStock);

    // Formatting total value
    const formattedValue = totalValue >= 1000000 
        ? 'â‚¹' + (totalValue / 1000000).toFixed(1) + 'M' 
        : totalValue >= 1000 
            ? 'â‚¹' + (totalValue / 1000).toFixed(1) + 'k' 
            : 'â‚¹' + totalValue.toFixed(2);
            
    const valEl = document.getElementById("stat-total-value");
    if (valEl) valEl.textContent = formattedValue;

    const recentEl = document.getElementById("stat-recently-updated");
    if (recentEl) {
        recentEl.innerHTML = `${recentlyUpdated} <span style="font-size: 1rem; color: #64748b; font-weight: 500;">Today</span>`;
    }
}
