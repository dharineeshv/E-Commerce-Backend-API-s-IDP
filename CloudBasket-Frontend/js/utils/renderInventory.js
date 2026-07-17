export function renderInventoryTable(inventoryItems) {
    const tableBody = document.getElementById("inventory-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!inventoryItems || inventoryItems.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 4rem;">
                    <div style="color: #94a3b8; font-size: 1.1rem;">No inventory records found.</div>
                </td>
            </tr>
        `;
        return;
    }

    inventoryItems.forEach(item => {
        // Safe access
        const product = item.product || {};
        
        const name = product.name || "Unknown Product";
        const category = product.category || "Uncategorized";
        const brand = product.brand || "No Brand";
        const image = product.imageUrl || "https://placehold.co/40x40/f1f5f9/94a3b8?text=Img";
        const pVal = product.sellingPrice != null ? product.sellingPrice : product.price;
        const price = pVal != null ? `₹${pVal.toFixed(2)}` : "N/A";
        
        const sku = item.sku || product.sku || "N/A";
        const warehouse = item.location || item.warehouse || "Main Warehouse";
        
        const avail = item.availableQuantity || item.quantity || 0;
        const resv = item.reservedQuantity || item.reserved || 0;
        const threshold = item.lowStockThreshold || item.threshold || 10;
        
        const totalCapacity = Math.max(avail + resv, threshold * 2, 100);
        const availPct = Math.min((avail / totalCapacity) * 100, 100);
        const resvPct = Math.min((resv / totalCapacity) * 100, 100);

        let statusClass = "in-stock";
        let statusText = "In Stock";
        if (avail === 0) {
            statusClass = "out-of-stock";
            statusText = "Out of Stock";
        } else if (avail <= threshold) {
            statusClass = "low-stock";
            statusText = "Low Stock";
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <div class="product-img-wrap">
                        <img src="${image}" alt="${name}" onerror="this.src='https://placehold.co/40x40/f1f5f9/94a3b8?text=Img'">
                    </div>
                    <div class="product-info">
                        <strong>${name}</strong>
                        <span>${category} - ${brand}</span>
                    </div>
                </div>
            </td>
            <td><span class="sku-badge">${sku}</span></td>
            <td><span style="font-weight: 500; color: #475569;">${warehouse}</span></td>
            <td><span style="font-weight: 600; color: #0f172a;">${price}</span></td>
            <td>
                <div class="stock-visual">
                    <div class="stock-text-flex">
                        <span class="avail">${avail} Available</span>
                        <span class="resv">${resv} Reserved</span>
                    </div>
                    <div class="progress-track" title="Threshold: ${threshold}">
                        <div class="progress-avail" style="width: ${availPct}%"></div>
                        <div class="progress-resv" style="width: ${resvPct}%"></div>
                    </div>
                </div>
            </td>
            <td style="position: relative;">
                <span class="status-pill ${statusClass}">${statusText}</span>
                
                <div class="action-glass-menu" style="position: absolute; right: 2rem; top: 50%; transform: translateY(-50%); display: flex; gap: 0.5rem; opacity: 0; transition: all 0.2s ease;">
                    <button class="btn-action view-btn" data-id="${item.inventoryId}" data-tooltip="View Inventory">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="btn-action stock-in-btn" data-id="${item.inventoryId}" data-tooltip="Stock In">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                    <button class="btn-action stock-out-btn" data-id="${item.inventoryId}" data-tooltip="Stock Out">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                    <button class="btn-action adjust-btn" data-id="${item.inventoryId}" data-tooltip="Stock Adjustment">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        
        // Add hover effect to show actions
        tr.addEventListener('mouseenter', () => {
            const menu = tr.querySelector('.action-glass-menu');
            if(menu) menu.style.opacity = '1';
        });
        tr.addEventListener('mouseleave', () => {
            const menu = tr.querySelector('.action-glass-menu');
            if(menu) menu.style.opacity = '0';
        });

        tableBody.appendChild(tr);
    });
}
