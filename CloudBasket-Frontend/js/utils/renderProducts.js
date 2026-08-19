export function renderProducts(products, tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    if (!products || products.length === 0) return;
    
    let html = '';
    products.forEach(product => {
        const { id, productId, _id, imageUrl, name, sku, sellingPrice, quantity, status, updatedAt, lowStockThreshold = 20 } = product;
        
        const actualId = id || productId || _id;
        
        let displayStatus = status;
        let badgeClass = '';
        let dotClass = '';
        
        const statusUpper = (status || '').toUpperCase();
        
        if (statusUpper === 'ACTIVE') {
            badgeClass = 'active';
            dotClass = 'in-stock';
        } else if (statusUpper === 'INACTIVE') {
            badgeClass = 'inactive';
            dotClass = 'out-stock';
        } else {
            badgeClass = 'inactive';
            dotClass = 'out-stock';
        }
        
        const qty = Number(quantity) || 0;
        if (qty <= lowStockThreshold) {
            displayStatus = 'Low Stock';
            badgeClass = 'low-stock';
            dotClass = 'low-stock';
        }

        let dateStr = 'N/A';
        let timeStr = '';
        if (updatedAt) {
            const dateObj = new Date(updatedAt);
            if (!isNaN(dateObj.getTime())) {
                dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }
        }

        let imgUrl = imageUrl || product.image;
        if (imgUrl && imgUrl.includes('amazonaws.com')) {
            try {
                const parsed = new URL(imgUrl);
                imgUrl = `https://cloudbasket-products-personal-dhari.s3.ap-southeast-1.amazonaws.com${parsed.pathname}`;
            } catch (e) {}
        }
        const prodTitle = name || 'Product';
        let fallbackImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
        if (prodTitle.toLowerCase().includes('vivo')) {
            fallbackImg = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80';
        }
        if (!imgUrl || imgUrl.includes('placeholder')) {
            imgUrl = fallbackImg;
        }

        html += `
            <tr>
                <td>
                    <div class="product-cell">
                        <img src="${imgUrl}" alt="${prodTitle}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                        <div class="product-name-sku">
                            <h4>${prodTitle}</h4>
                            <span>SKU: ${sku || 'N/A'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <strong>â‚¹${Number(sellingPrice || 0).toFixed(2)}</strong>
                </td>
                <td>
                    <span class="stock-badge ${dotClass}"><span class="dot"></span> ${qty}</span>
                </td>
                <td>
                    <span class="status-badge ${badgeClass}">${displayStatus || 'Unknown'}</span>
                </td>
                <td>
                    <div class="date-cell">
                        <span>${dateStr}</span>
                        <span class="time">${timeStr}</span>
                    </div>
                </td>
                <td class="actions-col">
                    <div class="action-buttons">
                        <button class="action-btn view-btn" title="View Product" data-id="${actualId}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="action-btn edit-btn" title="Edit Product" data-id="${actualId}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-btn delete-btn" title="Delete Product" data-id="${actualId}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

export function updateSummaryCards(products = []) {
    const safeProducts = Array.isArray(products) ? products : [];
    const lowStockThreshold = 20;
    
    const total = safeProducts.length;
    const active = safeProducts.filter(p => (p.status || '').toUpperCase() === 'ACTIVE').length;
    const inactive = safeProducts.filter(p => (p.status || '').toUpperCase() === 'INACTIVE').length;
    const lowStock = safeProducts.filter(p => Number(p.quantity || 0) <= (p.lowStockThreshold || lowStockThreshold)).length;
    
    const setElem = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val.toLocaleString('en-IN');
    };
    
    setElem('summary-total-products', total);
    setElem('summary-active-products', active);
    setElem('summary-inactive-products', inactive);
    setElem('summary-low-stock-products', lowStock);

    const cards = document.querySelectorAll('.summary-card h3');
    if (cards.length >= 4) {
        cards[0].textContent = total.toLocaleString('en-IN');
        cards[1].textContent = active.toLocaleString('en-IN');
        cards[2].textContent = inactive.toLocaleString('en-IN');
        cards[3].textContent = lowStock.toLocaleString('en-IN');
    }
}
