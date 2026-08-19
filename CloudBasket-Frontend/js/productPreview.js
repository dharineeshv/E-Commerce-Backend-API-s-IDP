// ==========================================
// CloudBasket Product Live Preview Module
// ==========================================

/**
 * Initializes the Live Preview card state
 */
export function initProductPreview() {
    updatePreview({});
}

/**
 * Updates all elements of the Live Preview Card dynamically
 * @param {Object} data - Current product form state
 */
export function updatePreview(data) {
    // 1. DOM Cache (Query selectors checked for existence to prevent null references)
    const previewTitle = document.getElementById('previewTitle');
    const previewSkuRef = document.getElementById('previewSkuRef');
    const previewCategory = document.getElementById('previewCategory');
    const previewPriceSelling = document.getElementById('previewPriceSelling');
    const previewPriceMrp = document.getElementById('previewPriceMrp');
    const previewPriceDiscount = document.getElementById('previewPriceDiscount');
    const previewStockQty = document.getElementById('previewStockQty');
    const previewStatusText = document.getElementById('previewStatusText');
    const previewStatusBadge = document.getElementById('previewStatusBadge');
    const previewSpecsGrid = document.getElementById('previewSpecsGrid');

    // 2. Title Preview
    if (previewTitle) {
        const titleVal = data.name ? data.name.trim() : '';
        previewTitle.innerText = titleVal !== '' ? titleVal : 'e.g. CloudTech Pro Laptop M1';
    }

    // 3. Brand & SKU Reference
    if (previewSkuRef) {
        const skuVal = data.sku ? data.sku.trim() : 'SKU-AUTO-294';
        const brandVal = data.brand ? data.brand.trim() : 'Select Brand';
        previewSkuRef.innerText = `Product Reference: ${skuVal} (${brandVal})`;
    }

    // 4. Category Badge
    if (previewCategory) {
        const categoryVal = data.category ? data.category.trim() : 'Electronics';
        previewCategory.innerText = categoryVal;
    }

    // 5. Stock Quantity
    if (previewStockQty) {
        const qtyVal = data.quantity !== undefined && data.quantity !== null && data.quantity !== '' ? data.quantity : '42'; // default mockup is 42
        previewStockQty.innerText = `${qtyVal} Units`;
    }

    // 6. Status Text and Badges
    const statusVal = data.status || 'Active';
    if (previewStatusText) {
        previewStatusText.innerText = statusVal;
    }
    if (previewStatusBadge) {
        previewStatusBadge.innerText = statusVal;
        if (statusVal.toLowerCase() === 'active') {
            previewStatusBadge.className = 'preview-badge-status active';
        } else {
            previewStatusBadge.className = 'preview-badge-status inactive';
        }
    }

    // 7. Pricing Display Calculations
    const mrpVal = parseFloat(data.mrp) || 0;
    const discountVal = parseFloat(data.discountPercentage) || 0;
    const sellingVal = parseFloat(data.sellingPrice) || 0;

    if (previewPriceSelling) {
        if (mrpVal > 0) {
            previewPriceSelling.innerText = `\u20B9${sellingVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            
            if (discountVal > 0) {
                if (previewPriceMrp) {
                    previewPriceMrp.innerText = `\u20B9${mrpVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    previewPriceMrp.style.display = 'inline';
                }
                if (previewPriceDiscount) {
                    previewPriceDiscount.innerText = `-${discountVal}%`;
                    previewPriceDiscount.style.display = 'inline-block';
                }
            } else {
                if (previewPriceMrp) previewPriceMrp.style.display = 'none';
                if (previewPriceDiscount) previewPriceDiscount.style.display = 'none';
            }
        } else {
            // Default placeholder layout matching prompt
            previewPriceSelling.innerText = '$1,299.00';
            if (previewPriceMrp) {
                previewPriceMrp.innerText = '$1,599.00';
                previewPriceMrp.style.display = 'inline';
            }
            if (previewPriceDiscount) {
                previewPriceDiscount.innerText = '-18%';
                previewPriceDiscount.style.display = 'inline-block';
            }
        }
    }

    // 8. Dynamic Specifications Preview
    if (previewSpecsGrid) {
        previewSpecsGrid.innerHTML = '';
        let specCount = 0;

        if (data.specifications && typeof data.specifications === 'object') {
            for (const [name, value] of Object.entries(data.specifications)) {
                const cleanName = name.trim();
                const cleanValue = value.trim();

                if (cleanName !== '' && cleanValue !== '') {
                    specCount++;
                    const specBox = document.createElement('div');
                    specBox.className = 'preview-spec-box';

                    const specLbl = document.createElement('span');
                    specLbl.className = 'preview-spec-lbl';
                    specLbl.innerText = cleanName;

                    const specVal = document.createElement('span');
                    specVal.className = 'preview-spec-val';
                    specVal.innerText = cleanValue;

                    specBox.appendChild(specLbl);
                    specBox.appendChild(specVal);
                    previewSpecsGrid.appendChild(specBox);
                }
            }
        }

        if (specCount === 0) {
            previewSpecsGrid.innerHTML = '<span style="grid-column: span 2; font-size: 13px; color: #9ca3af; font-style: italic;">No specifications added yet.</span>';
        }
    }
}

/**
 * Updates the image preview on the preview card
 * @param {string} srcUrl - Image source (base64 or S3 URL)
 * @param {boolean} showPlaceholder - Toggle placeholder visibility
 */
export function updatePreviewImage(srcUrl, showPlaceholder = false) {
    const previewImg = document.getElementById('previewImg');
    const placeholderIcon = document.getElementById('previewPlaceholderIcon');

    if (previewImg && placeholderIcon) {
        if (showPlaceholder) {
            previewImg.style.display = 'none';
            placeholderIcon.style.display = 'block';
        } else {
            previewImg.src = srcUrl;
            previewImg.style.display = 'block';
            placeholderIcon.style.display = 'none';
        }
    }
}
