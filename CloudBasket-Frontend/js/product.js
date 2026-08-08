import { apiFetch } from "./api/apiClient.js";
import { getActiveFestivalSale } from "./api/marketingApi.js";
import { fetchProductReviews, postReview, deleteReviewApi } from "./api/reviewApi.js";

let activeFestivalSale = null;

document.addEventListener("DOMContentLoaded", () => {
    initProductPage();
});

async function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.getElementById('pd-title').innerText = "Product Not Found";
        return;
    }

    let product = null;
    let allProducts = [];

    // Try fetching from API
    try {
        const response = await fetch('https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/products');
        const data = await response.json();
        
        if (data.success && data.products) {
            allProducts = data.products;
        } else {
            allProducts = data;
        }

        if (!allProducts || allProducts.length === 0) {
            allProducts = getMockProducts();
        }
    } catch (error) {
        console.warn("Failed to fetch real products, falling back to mock.", error);
        allProducts = getMockProducts();
    }

    try {
        const festRes = await getActiveFestivalSale();
        if (festRes && festRes.success && festRes.data) {
            activeFestivalSale = festRes.data;
        }
    } catch (e) {
        console.error("Failed to load festival sale", e);
    }

    product = allProducts.find(p => (p.productId || p.id) === productId);

    if (!product) {
        document.getElementById('pd-title').innerText = "Product Not Found";
        return;
    }

    renderProductDetails(product);
    renderSimilarProducts(product, allProducts);
    setupTabs();
    initReviewsSection(productId);
    
    // Wire Add to Cart & Buy Now
    const addBtn = document.getElementById('pd-add-to-cart-btn');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            if (addBtn.disabled || addBtn.getAttribute('disabled') !== null) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            addToCart(productId, product.name || product.title);
        });
    }

    const buyNowBtn = document.getElementById('pd-buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', async (e) => {
            if (buyNowBtn.disabled || buyNowBtn.getAttribute('disabled') !== null) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            buyNowBtn.disabled = true;
            buyNowBtn.innerHTML = `<span>Processing...</span>`;

            const price = Number(product.sellingPrice || product.price || product.mrp || 0);
            const directItem = {
                productId: productId,
                productName: product.name || product.title || 'Product',
                price: price,
                sellingPrice: price,
                imageUrl: product.imageUrl || product.image || (product.images && product.images[0]) || '',
                quantity: 1,
                isDirectBuyNow: true
            };
            sessionStorage.setItem('direct_buy_now_item', JSON.stringify(directItem));

            try {
                await addToCart(productId, product.name || product.title);
            } catch(err) {}
            window.location.href = 'checkout.html';
        });
    }
}

function renderProductDetails(product) {
    const title = product.name || product.title || 'Unknown Product';
    const category = product.category || 'Category';
    const price = product.sellingPrice || product.price || 0;
    const imageUrl = product.imageUrl || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
    const discount = product.discountPercentage || product.discount || 0;
    let originalPrice = product.mrp || (price / (1 - (discount/100))).toFixed(2);
    
    let currentPrice = Number(price);
    let isFestivalDiscounted = false;
    if (activeFestivalSale) {
        if (activeFestivalSale.discountType === 'percentage' || activeFestivalSale.discountType === 'PERCENTAGE') {
            currentPrice = currentPrice * (1 - (activeFestivalSale.discountValue / 100));
        } else {
            currentPrice = Math.max(0, currentPrice - activeFestivalSale.discountValue);
        }
        if (currentPrice < Number(price)) {
            isFestivalDiscounted = true;
            originalPrice = Number(price).toFixed(2);
        }
    }
    const sku = product.sku || `CB-${(product.productId || product.id).toUpperCase().substring(0,6)}-${category.substring(0,3).toUpperCase()}`;
    const desc = product.description || "No description available.";
    
    // Breadcrumbs (optional)
    const bcCat = document.getElementById('bc-category');
    if (bcCat) bcCat.innerText = category;
    const bcTitle = document.getElementById('bc-title');
    if (bcTitle) bcTitle.innerText = title;



    const sanitizeUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
        
        try {
            if (url.includes('amazonaws.com')) {
                const parsed = new URL(url);
                return `https://d2vghmouksu39n.cloudfront.net${parsed.pathname}`;
            }
        } catch (e) {}
        return url;
        
    };

    const fallbackImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
    let defaultImageUrl = sanitizeUrl(imageUrl);

    // Image and Thumbnails
    const mainImageEl = document.getElementById('pd-image');
    mainImageEl.onerror = function() { this.onerror=null; this.src = fallbackImg; };

    const prevBtn = document.getElementById('pd-prev-btn');
    const nextBtn = document.getElementById('pd-next-btn');

    let galleryUrls = [];
    if (product.images && product.images.length > 0) {
        galleryUrls = product.images.map(imgObj => {
            return sanitizeUrl(typeof imgObj === 'string' ? imgObj : (imgObj.imageUrl || imgObj.url || imgObj.image));
        }).filter(Boolean);
    } 
    if (galleryUrls.length === 0 && defaultImageUrl) {
        galleryUrls = [defaultImageUrl];
    }

    let currentImgIdx = 0;

    function setActiveImage(index) {
        if (galleryUrls.length === 0) return;
        currentImgIdx = (index + galleryUrls.length) % galleryUrls.length;
        mainImageEl.src = galleryUrls[currentImgIdx];

        const thumbs = document.querySelectorAll('.pd-thumbnail');
        thumbs.forEach((t, i) => {
            if (i === currentImgIdx) t.classList.add('active');
            else t.classList.remove('active');
        });
    }

    if (galleryUrls.length > 1) {
        if (prevBtn) {
            prevBtn.classList.add('has-multiple');
            prevBtn.style.display = 'flex';
            prevBtn.onclick = (e) => {
                e.stopPropagation();
                setActiveImage(currentImgIdx - 1);
            };
        }
        if (nextBtn) {
            nextBtn.classList.add('has-multiple');
            nextBtn.style.display = 'flex';
            nextBtn.onclick = (e) => {
                e.stopPropagation();
                setActiveImage(currentImgIdx + 1);
            };
        }
    } else {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }

    const thumbnailsContainer = document.getElementById('pd-thumbnails');
    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';
        if (galleryUrls.length > 0) {
            mainImageEl.src = galleryUrls[0];
            galleryUrls.forEach((thumbUrl, index) => {
                const thumb = document.createElement('img');
                thumb.src = thumbUrl;
                thumb.onerror = function() { this.onerror=null; this.src = fallbackImg; };
                thumb.className = 'pd-thumbnail';
                if (index === 0) thumb.classList.add('active');

                thumb.addEventListener('mouseover', () => {
                    setActiveImage(index);
                });

                thumbnailsContainer.appendChild(thumb);
            });
        } else {
            mainImageEl.src = defaultImageUrl;
        }
    }

    // Meta
    document.getElementById('pd-sku').innerText = `SKU: ${sku}`;
    
    // Stock Status Evaluation
    const availableQty = (product.availableQuantity !== undefined && product.availableQuantity !== null) 
        ? Number(product.availableQuantity) 
        : ((product.stock !== undefined && product.stock !== null) 
            ? Number(product.stock) 
            : ((product.quantity !== undefined && product.quantity !== null) 
                ? Number(product.quantity) 
                : (product.inStock === false ? 0 : 10)));

    const isExplicitlyOut = product.inStock === false || 
        (product.status && (
            product.status.toUpperCase() === 'OUT_OF_STOCK' || 
            product.status.toUpperCase() === 'OUT OF STOCK' || 
            product.status.toUpperCase() === 'INACTIVE'
        ));

    const isOutOfStock = availableQty <= 0 || isExplicitlyOut;

    const stockEl = document.getElementById('pd-stock');
    if (stockEl) {
        if (isOutOfStock) {
            stockEl.className = 'pd-stock out-of-stock';
            stockEl.style.backgroundColor = '#fef2f2';
            stockEl.style.color = '#dc2626';
            stockEl.style.border = '1px solid #fecaca';
            stockEl.style.padding = '4px 10px';
            stockEl.style.borderRadius = '20px';
            stockEl.style.fontWeight = '600';
            stockEl.style.display = 'inline-flex';
            stockEl.style.alignItems = 'center';
            stockEl.style.gap = '6px';
            stockEl.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Out of Stock
            `;
        } else {
            stockEl.className = 'pd-stock in-stock';
            stockEl.style.backgroundColor = '#f0fdf4';
            stockEl.style.color = '#16a34a';
            stockEl.style.border = '1px solid #bbf7d0';
            stockEl.style.padding = '4px 10px';
            stockEl.style.borderRadius = '20px';
            stockEl.style.fontWeight = '600';
            stockEl.style.display = 'inline-flex';
            stockEl.style.alignItems = 'center';
            stockEl.style.gap = '6px';
            stockEl.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                In Stock
            `;
        }
    }

    const addCartBtn = document.getElementById('pd-add-to-cart-btn');
    const buyNowBtn = document.getElementById('pd-buy-now-btn');

    if (isOutOfStock) {
        if (addCartBtn) {
            addCartBtn.disabled = true;
            addCartBtn.setAttribute('disabled', 'true');
            addCartBtn.style.opacity = '0.55';
            addCartBtn.style.cursor = 'not-allowed';
            addCartBtn.style.background = '#94a3b8';
            addCartBtn.style.borderColor = '#94a3b8';
            addCartBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Out of Stock
            `;
        }
        if (buyNowBtn) {
            buyNowBtn.disabled = true;
            buyNowBtn.setAttribute('disabled', 'true');
            buyNowBtn.style.opacity = '0.55';
            buyNowBtn.style.cursor = 'not-allowed';
            buyNowBtn.style.background = '#64748b';
            buyNowBtn.style.borderColor = '#64748b';
            buyNowBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Out of Stock
            `;
        }
    }

    // Title
    document.getElementById('pd-title').innerText = title;

    // Pricing
    document.getElementById('pd-price').innerText = `₹${Number(currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const mrpEl = document.getElementById('pd-mrp');
    const discEl = document.getElementById('pd-discount');
    
    if (isFestivalDiscounted) {
        mrpEl.innerText = `₹${Number(originalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        mrpEl.style.display = 'inline';
        
        discEl.innerText = `Festival Sale`;
        discEl.style.display = 'inline';
        discEl.style.backgroundColor = '#ef4444';
        discEl.style.color = '#fff';
    } else if (discount > 0) {
        mrpEl.innerText = `₹${Number(originalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        mrpEl.style.display = 'inline';
        
        discEl.innerText = `-${discount}%`;
        discEl.style.display = 'inline';
    } else {
        mrpEl.style.display = 'none';
        discEl.style.display = 'none';
    }

    // Description
    document.getElementById('pd-description').innerText = desc;

    // Specs
    const specsGrid = document.getElementById('pd-specs-grid');
    const specs = product.specifications || getDefaultSpecs();
    
    let specsHtml = '';
    for (const [key, val] of Object.entries(specs)) {
        specsHtml += `
            <div class="pd-spec-item">
                <span class="pd-spec-label">${key}</span>
                <span class="pd-spec-value">${val}</span>
            </div>
        `;
    }
    specsGrid.innerHTML = specsHtml;
}

function setupTabs() {
    const tabs = document.querySelectorAll('.pd-tab');
    const panes = document.querySelectorAll('.pd-tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.style.display = 'none');

            // Add active to current
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';
        });
    });
}

let userWishlistIds = new Set();
let CUSTOMER_ID = 'cust-001'; // Default test customer
try {
    const token = localStorage.getItem('idToken') || localStorage.getItem('accessToken');
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) CUSTOMER_ID = payload.sub;
    }
} catch (e) {
    console.error("Failed to parse token for CUSTOMER_ID", e);
}

if (CUSTOMER_ID && CUSTOMER_ID !== 'cust-001') {
    apiFetch(`https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/wishlist/${CUSTOMER_ID}`)
        .then(res => res.ok ? res.json() : null)
        .then(wishData => {
            if (wishData && wishData.items) {
                wishData.items.forEach(item => {
                    if (item.productDetails && (item.productDetails.productId || item.productDetails.id)) {
                        userWishlistIds.add(item.productDetails.productId || item.productDetails.id);
                    } else if (item.productId) {
                        userWishlistIds.add(item.productId);
                    }
                });
            }
        }).catch(() => {});
}

window.toggleWishlist = async function(event, id, btnElement) {
    event.stopPropagation();
    try {
        const svg = btnElement.querySelector('svg');
        const svgFill = svg ? svg.getAttribute('fill') : '';
        const isAdded = btnElement.style.color === 'rgb(239, 68, 68)' || 
                        btnElement.style.color === '#ef4444' || 
                        svgFill === '#ef4444' || 
                        svgFill === 'rgb(239, 68, 68)';

        if (isAdded) {
            const response = await apiFetch(`https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/wishlist/${CUSTOMER_ID}/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                userWishlistIds.delete(id);
                btnElement.style.color = '#64748b';
                btnElement.style.fill = 'none';
                if (svg) {
                    svg.setAttribute('fill', 'none');
                    svg.style.fill = 'none';
                }
            }
        } else {
            const response = await apiFetch(`https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/wishlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: CUSTOMER_ID, productId: id })
            });
            if (response.ok) {
                userWishlistIds.add(id);
                btnElement.style.color = '#ef4444';
                btnElement.style.fill = '#ef4444';
                if (svg) {
                    svg.setAttribute('fill', '#ef4444');
                    svg.style.fill = '#ef4444';
                }
            }
        }
    } catch (error) {
        console.error("Error toggling wishlist", error);
    }
};

window.viewProduct = function(productIdOrObj) {
    const id = typeof productIdOrObj === 'string' ? productIdOrObj : (productIdOrObj.productId || productIdOrObj.id);
    if (id) {
        window.location.href = `product.html?id=${id}`;
    }
};

async function renderSimilarProducts(currentProduct, allProducts) {
    const grid = document.getElementById('similar-products-grid');
    if (!grid) return;
    
    // Filter by same category or brand, exclude current
    let similar = allProducts.filter(p => {
        if ((p.productId || p.id) === (currentProduct.productId || currentProduct.id)) return false;
        const sameCategory = p.category && currentProduct.category && p.category.toLowerCase() === currentProduct.category.toLowerCase();
        const sameBrand = p.brand && currentProduct.brand && p.brand.toLowerCase() === currentProduct.brand.toLowerCase();
        return sameCategory || sameBrand;
    });
    
    // Take up to 4
    similar = similar.slice(0, 4);
    
    // If still empty, fallback to random products
    if (similar.length === 0) {
        similar = allProducts
            .filter(p => (p.productId || p.id) !== (currentProduct.productId || currentProduct.id))
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);
    }
    
    grid.innerHTML = '';
    
    if (similar.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 40px 0;">No similar products found.</div>';
        return;
    }

    // Fetch review summaries for similar products
    await Promise.all(similar.map(async (product) => {
        const pId = product.productId || product.id;
        if (pId) {
            try {
                const revRes = await fetchProductReviews(pId);
                if (revRes && revRes.summary) {
                    product.rating = revRes.summary.averageRating || product.rating || 4.5;
                    product.reviewsCount = revRes.summary.totalReviews !== undefined ? revRes.summary.totalReviews : (product.reviews || 0);
                }
            } catch (e) {}
        }
        if (!product.rating) {
            product.rating = 4.5;
            product.reviewsCount = product.reviews || 8;
        }
    }));

    similar.forEach(product => {
        const id = product.productId || product.id || Math.random().toString(36).substr(2, 9);
        const title = product.name || product.title;
        const category = product.category || 'CATEGORY';
        const price = product.sellingPrice || product.price;
        const rating = product.rating || 4.5;
        const reviewsCount = product.reviewsCount !== undefined ? product.reviewsCount : (product.reviews || 0);

        let imageUrl = product.imageUrl || product.image;
        if (imageUrl && imageUrl.includes('amazonaws.com')) {
            try {
                const parsed = new URL(imageUrl);
                imageUrl = `https://d2vghmouksu39n.cloudfront.net${parsed.pathname}`;
            } catch (e) {}
        }
        if (!imageUrl || imageUrl.includes('placeholder')) {
            imageUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
        }

        let fallbackImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
        if (title.toLowerCase().includes('vivo')) {
            fallbackImg = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80';
        }

        const discount = product.discountPercentage || product.discount || 10;
        let originalPrice = product.mrp || (price / (1 - (discount/100))).toFixed(2);

        // Stock badge evaluation (only show if stock is low or out of stock)
        const qty = (product.availableQuantity !== undefined && product.availableQuantity !== null) 
            ? Number(product.availableQuantity) 
            : ((product.quantity !== undefined && product.quantity !== null) 
                ? Number(product.quantity) 
                : ((product.stockQuantity !== undefined && product.stockQuantity !== null) 
                    ? Number(product.stockQuantity) 
                    : ((product.stock !== undefined && product.stock !== null) 
                        ? Number(product.stock) 
                        : null)));

        const lowStockThreshold = Number(product.lowStockThreshold || 10);
        const isLowStock = product.isLowStock || (qty !== null && qty > 0 && qty <= lowStockThreshold) || (product.stockStatus === 'low_stock');
        const isOutOfStock = (qty !== null && qty <= 0) || 
            product.inStock === false || 
            (product.stockStatus === 'out_of_stock') || 
            (product.status && (
                product.status.toUpperCase() === 'OUT_OF_STOCK' || 
                product.status.toUpperCase() === 'OUT OF STOCK' || 
                product.status.toUpperCase() === 'INACTIVE'
            ));

        let stockBadgeHtml = '';
        if (isOutOfStock) {
            stockBadgeHtml = `<div style="position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; z-index: 2;">Out of Stock</div>`;
        } else if (isLowStock) {
            stockBadgeHtml = `<div style="position: absolute; top: 10px; left: 10px; background: #dc2626; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; z-index: 2;">Low Stock</div>`;
        }

        const isInWishlist = userWishlistIds.has(id);
        const heartColor = isInWishlist ? '#ef4444' : '#64748b';
        const heartFill = isInWishlist ? '#ef4444' : 'none';

        const cartBtnHtml = isOutOfStock
            ? `<button class="add-to-cart-btn disabled" disabled data-product-id="${id}" data-product-name="${title.replace(/"/g, '&quot;')}" title="Out of Stock" style="background: #cbd5e1; color: #94a3b8; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: not-allowed; opacity: 0.5;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
               </button>`
            : `<button class="add-to-cart-btn" data-product-id="${id}" data-product-name="${title.replace(/"/g, '&quot;')}" style="background: #0f3d7a; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s, background 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"></path></svg>
               </button>`;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-img-container" style="position: relative; overflow: hidden;" onclick="viewProduct('${id}')">
                ${stockBadgeHtml}
                <button class="wishlist-btn" onclick="toggleWishlist(event, '${id}', this)" style="position: absolute; top: 10px; right: 10px; background: white; border: 1px solid #f1f5f9; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); cursor: pointer; color: ${heartColor}; z-index: 2;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${heartFill}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
                    </svg>
                </button>
                <img src="${imageUrl}" alt="${title}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                <div class="hover-view-overlay" style="position: absolute; bottom: -50px; left: 0; right: 0; padding: 10px; text-align: center; transition: bottom 0.3s; display: flex; justify-content: center; z-index: 2;">
                    <button class="view-details-btn" onclick="viewProduct('${id}'); event.stopPropagation();" style="background: white; border: none; border-radius: 20px; padding: 8px 20px; font-size: 0.85rem; font-weight: 700; color: #0f3d7a; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">Quick View</button>
                </div>
            </div>
            <div class="card-body" style="padding: 15px; display: flex; flex-direction: column; gap: 4px; flex-grow: 1;">
                <div style="font-size: 0.65rem; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">${category}</div>
                <h3 class="card-title" style="margin: 0 0 2px 0; font-size: 1rem; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</h3>
                
                <div class="product-rating" style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                    <span class="rating-stars" style="color: #f59e0b; font-size: 0.85rem; letter-spacing: 1px;">${renderStarRating(rating)}</span>
                    <span class="rating-val" style="font-size: 0.75rem; font-weight: 600; color: #475569; margin-left: 2px;">${Number(rating).toFixed(1)}</span>
                    <span class="rating-count" style="font-size: 0.7rem; color: #94a3b8;">(${reviewsCount})</span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto;">
                    <div class="price-block" style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.8rem; color: #94a3b8; text-decoration: line-through;">\u20B9${originalPrice}</span>
                        <span class="new-price" style="font-size: 1.1rem; font-weight: 700; color: #0f3d7a;">\u20B9${Number(price).toFixed(2)}</span>
                    </div>
                    ${cartBtnHtml}
                </div>
            </div>
        `;
        
        // Add To Cart Event Listener
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            if (isOutOfStock) {
                addToCartBtn.disabled = true;
                addToCartBtn.setAttribute('disabled', 'true');
                addToCartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                });
            } else {
                addToCartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToCart(id, title);
                });
            }
        }
        
        grid.appendChild(card);
    });
}

async function addToCart(productId, productName) {
    try {
        const response = await apiFetch(`https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/cart`, {
            method: 'POST',
            body: JSON.stringify({
                productId: productId,
                quantity: 1
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            if (window.showCustomAlert) window.showCustomAlert(`Successfully added ${productName} to cart!`);
            else alert(`Successfully added ${productName} to cart!`);
        } else {
            if (window.showCustomAlert) window.showCustomAlert(`Failed to add to cart: ${data.message || 'Unknown error'}`);
            else alert(`Failed to add to cart: ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        if (window.showCustomAlert) window.showCustomAlert("An error occurred while connecting to the Cart Service. Is it running?");
        else alert("An error occurred while connecting to the Cart Service. Is it running?");
    }
}

function getDefaultSpecs() {
    return {
        "CPU ARCHITECTURE": "Sapphire Rapids-SP (10nm Enhanced SuperFin)",
        "L3 CACHE": "210MB Shared Intel® Smart Cache",
        "TDP / POWER DRAW": "350W Base / 420W Peak per Socket",
        "MEMORY TYPE": "8-Channel DDR5-4800 ECC RDIMM",
        "MTBF RATING": "2,500,000 Hours (Industrial Grade)",
        "CERTIFICATIONS": "CE, FCC Class A, UL, RoHS, TAA Compliant",
        "PCIE LANES": "80 Lanes PCIe Gen 5.0",
        "THERMAL MANAGEMENT": "Active Liquid-to-Air Heat Exchange"
    };
}

function getMockProducts() {
    return [
        {
            productId: "mock-1",
            title: "ProVision Elite Smartphone 512GB Space Black",
            category: "ELECTRONICS",
            price: 1099.00,
            imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80",
            discount: 15
        },
        {
            productId: "mock-2",
            title: "SonicFlow Studio Wireless Headphones - Midnight Navy",
            category: "ELECTRONICS",
            price: 349.00,
            imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
            discount: 10
        },
        {
            productId: "mock-3",
            title: "AeroPrecision Smart Electric Kettle 1.7L",
            category: "HOME",
            price: 129.00,
            imageUrl: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=500&q=80",
            discount: 20
        },
        {
            productId: "mock-4",
            title: "UltraVision 4K Professional Designer Display 32\"",
            category: "ELECTRONICS",
            price: 799.00,
            imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80",
            discount: 12
        },
        {
            productId: "CB-TTX9",
            title: "TechTitan Elite X-9000",
            category: "Infrastructure",
            price: 4999.00,
            imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
            discount: 0,
            sku: "CB-TTX9-INFRA",
            specifications: {
                "CPU ARCHITECTURE": "Sapphire Rapids-SP (10nm Enhanced SuperFin)",
                "L3 CACHE": "210MB Shared Intel® Smart Cache",
                "TDP / POWER DRAW": "350W Base / 420W Peak per Socket",
                "MEMORY TYPE": "8-Channel DDR5-4800 ECC RDIMM",
                "MTBF RATING": "2,500,000 Hours (Industrial Grade)",
                "CERTIFICATIONS": "CE, FCC Class A, UL, RoHS, TAA Compliant",
                "PCIE LANES": "80 Lanes PCIe Gen 5.0",
                "THERMAL MANAGEMENT": "Active Liquid-to-Air Heat Exchange"
            }
        }
    ];
}

/* ==========================================================
   Review & Rating Service Integration
========================================================== */

async function initReviewsSection(productId) {
    setupReviewForm(productId);
    await loadAndRenderReviews(productId);
}

async function loadAndRenderReviews(productId) {
    try {
        const data = await fetchProductReviews(productId);
        const reviews = data.reviews || [];
        const summary = data.summary || { averageRating: 0, totalReviews: 0, ratingBreakdown: {5:0,4:0,3:0,2:0,1:0} };

        // 1. Header Rating Badge
        const headerStarsEl = document.getElementById('pd-star-header');
        const headerTextEl = document.getElementById('pd-rating-header-text');
        if (headerStarsEl) headerStarsEl.innerHTML = renderStarRating(summary.averageRating);
        if (headerTextEl) headerTextEl.innerText = summary.totalReviews > 0 
            ? `(${summary.averageRating}★ • ${summary.totalReviews} ${summary.totalReviews === 1 ? 'review' : 'reviews'})`
            : `(No reviews yet)`;

        // 2. Tab Count
        const countEl = document.getElementById('pd-reviews-count');
        if (countEl) countEl.innerText = summary.totalReviews;

        // 3. Left Summary Card
        const avgEl = document.getElementById('summary-avg-rating');
        const starsEl = document.getElementById('summary-stars');
        const totalTextEl = document.getElementById('summary-total-text');
        const breakdownListEl = document.getElementById('rating-breakdown-list');

        if (avgEl) avgEl.innerText = summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '0.0';
        if (starsEl) starsEl.innerHTML = renderStarRating(summary.averageRating);
        if (totalTextEl) totalTextEl.innerText = `Based on ${summary.totalReviews} ${summary.totalReviews === 1 ? 'review' : 'reviews'}`;

        if (breakdownListEl) {
            breakdownListEl.innerHTML = '';
            [5, 4, 3, 2, 1].forEach((star) => {
                const count = (summary.ratingBreakdown && summary.ratingBreakdown[star]) || 0;
                const percent = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;
                const row = document.createElement('div');
                row.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569;';
                row.innerHTML = `
                    <span style="width: 38px;">${star} star</span>
                    <div style="flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${percent}%; height: 100%; background: #f59e0b; border-radius: 4px;"></div>
                    </div>
                    <span style="width: 32px; text-align: right; color: #64748b;">${percent}%</span>
                `;
                breakdownListEl.appendChild(row);
            });
        }

        // 4. Right Review List
        const listEl = document.getElementById('product-reviews-list');
        if (listEl) {
            listEl.innerHTML = '';
            if (reviews.length === 0) {
                listEl.innerHTML = `
                    <div style="text-align: center; background: #f8fafc; padding: 40px; border-radius: 12px; border: 1px dashed #cbd5e1;">
                        <p style="color: #64748b; font-weight: 500; margin: 0 0 8px 0;">No reviews for this product yet.</p>
                        <p style="color: #94a3b8; font-size: 14px; margin: 0;">Be the first customer to write a review!</p>
                    </div>
                `;
            } else {
                reviews.forEach((rev) => {
                    const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently';
                    let authorName = rev.customerName;
                    if (!authorName || authorName === 'anonymous') {
                        authorName = "Verified Customer";
                    }
                    const revId = rev.reviewId || rev.id;
                    const isOwnReview = isReviewOwnedByCurrentUser(rev);

                    const card = document.createElement('div');
                    card.className = 'review-card';
                    card.style.cssText = 'background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative;';
                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <div>
                                <div style="color: #f59e0b; font-size: 16px; margin-bottom: 4px;">${renderStarRating(rev.rating)}</div>
                                <h4 style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 700;">${escapeHtml(rev.title || 'Great Product')}</h4>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 12px; color: #94a3b8;">${dateStr}</span>
                                ${(revId && isOwnReview) ? `
                                <button class="delete-review-btn" data-review-id="${revId}" title="Delete Review" style="background: #fef2f2; border: 1px solid #fee2e2; cursor: pointer; color: #ef4444; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: 12px; transition: all 0.2s;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                        <p style="margin: 8px 0 12px 0; color: #334155; font-size: 14px; line-height: 1.6;">${escapeHtml(rev.comment)}</p>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b;">
                            <span style="font-weight: 600; color: #475569;">${escapeHtml(authorName)}</span>
                            <span>•</span>
                            <span style="color: #16a34a; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Verified Purchase
                            </span>
                        </div>
                    `;

                    const deleteBtn = card.querySelector('.delete-review-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            const targetRevId = deleteBtn.getAttribute('data-review-id');
                            if (!targetRevId) return;

                            showConfirmPopup("Are you sure you want to delete this review?", async () => {
                                deleteBtn.disabled = true;
                                try {
                                    const res = await deleteReviewApi(targetRevId, productId);
                                    if (res && res.success) {
                                        showAlertPopup("Review deleted successfully.");
                                        await loadAndRenderReviews(productId);
                                    } else {
                                        showAlertPopup("Failed to delete review.");
                                        deleteBtn.disabled = false;
                                    }
                                } catch (err) {
                                    console.error("Delete review error:", err);
                                    showAlertPopup("Failed to delete review.");
                                    deleteBtn.disabled = false;
                                }
                            });
                        });
                    }

                    listEl.appendChild(card);
                });
            }
        }
    } catch (e) {
        console.error("Error loading product reviews:", e);
    }
}

function renderStarRating(rating) {
    const r = Math.min(5, Math.max(0, Number(rating) || 0));
    const fullStars = Math.floor(r);
    const hasHalf = (r - fullStars) >= 0.5;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (hasHalf && fullStars < 5) stars += '½';
    const emptyCount = 5 - fullStars - (hasHalf ? 1 : 0);
    for (let i = 0; i < emptyCount; i++) stars += '☆';
    return stars;
}

function getCurrentUserDisplayName() {
    let name = localStorage.getItem("userName") || localStorage.getItem("userEmail");
    if (!name) {
        try {
            const idToken = localStorage.getItem('idToken') || localStorage.getItem('accessToken');
            if (idToken) {
                const payload = JSON.parse(atob(idToken.split('.')[1]));
                if (payload.name) name = payload.name;
                else if (payload.given_name) name = `${payload.given_name} ${payload.family_name || ''}`.trim();
                else if (payload.email) {
                    const parts = payload.email.split('@')[0].split('.');
                    name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
                } else if (payload["cognito:username"]) {
                    name = payload["cognito:username"];
                }
            }
        } catch (e) {}
    }
    return name || "Customer";
}

function isReviewOwnedByCurrentUser(rev) {
    let currentName = (getCurrentUserDisplayName() || '').toLowerCase().trim();
    let currentEmail = (localStorage.getItem("userEmail") || '').toLowerCase().trim();
    
    let currentSub = '';
    try {
        const idToken = localStorage.getItem('idToken') || localStorage.getItem('accessToken');
        if (idToken) {
            const payload = JSON.parse(atob(idToken.split('.')[1]));
            currentSub = (payload.sub || payload["cognito:username"] || '').toLowerCase().trim();
            if (payload.email && !currentEmail) {
                currentEmail = payload.email.toLowerCase().trim();
            }
        }
    } catch (e) {}

    const revAuthor = (rev.customerName || rev.name || rev.author || '').toLowerCase().trim();
    const revCustId = (rev.customerId || rev.userId || rev.sub || '').toLowerCase().trim();
    const revEmail = (rev.email || rev.customerEmail || '').toLowerCase().trim();

    if (revCustId && currentSub && revCustId === currentSub) return true;
    if (revEmail && currentEmail && revEmail === currentEmail) return true;
    if (revAuthor && currentName && revAuthor !== 'verified customer' && revAuthor !== 'anonymous') {
        if (revAuthor === currentName || currentName.includes(revAuthor) || revAuthor.includes(currentName)) {
            return true;
        }
    }
    if (rev.reviewId && String(rev.reviewId).startsWith('rev-user-')) return true;

    return false;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showConfirmPopup(message, onConfirm) {
    if (typeof window.showCustomConfirm === 'function') {
        window.showCustomConfirm(message, onConfirm);
        return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease;';

    const box = document.createElement('div');
    box.style.cssText = 'background: white; padding: 28px 24px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04); max-width: 400px; width: 90%; text-align: center; transform: scale(0.95); transition: transform 0.2s ease;';

    box.innerHTML = `
        <div style="width: 48px; height: 48px; border-radius: 50%; background: #fef2f2; color: #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0f172a;">Delete Review</h3>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b; line-height: 1.5;">${escapeHtml(message)}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn-cancel-modal" style="flex: 1; padding: 10px 18px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">Cancel</button>
            <button class="btn-confirm-modal" style="flex: 1; padding: 10px 18px; background: #ef4444; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">Delete</button>
        </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        box.style.transform = 'scale(1)';
    });

    const closeOverlay = () => {
        overlay.style.opacity = '0';
        box.style.transform = 'scale(0.95)';
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 200);
    };

    box.querySelector('.btn-cancel-modal').onclick = closeOverlay;
    box.querySelector('.btn-confirm-modal').onclick = () => {
        closeOverlay();
        onConfirm();
    };
    overlay.onclick = (e) => {
        if (e.target === overlay) closeOverlay();
    };
}

function showAlertPopup(message) {
    if (typeof window.showCustomAlert === 'function') {
        window.showCustomAlert(message);
        return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease;';

    const box = document.createElement('div');
    box.style.cssText = 'background: white; padding: 28px 24px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04); max-width: 380px; width: 90%; text-align: center; transform: scale(0.95); transition: transform 0.2s ease;';

    box.innerHTML = `
        <div style="width: 48px; height: 48px; border-radius: 50%; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>
        <p style="margin: 0 0 20px 0; font-size: 15px; font-weight: 600; color: #0f172a; line-height: 1.5;">${escapeHtml(message)}</p>
        <button class="btn-ok-modal" style="width: 100%; padding: 10px; background: #003366; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">OK</button>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        box.style.transform = 'scale(1)';
    });

    const closeOverlay = () => {
        overlay.style.opacity = '0';
        box.style.transform = 'scale(0.95)';
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 200);
    };

    box.querySelector('.btn-ok-modal').onclick = closeOverlay;
    overlay.onclick = (e) => {
        if (e.target === overlay) closeOverlay();
    };
}

function setupReviewForm(productId) {
    const btnOpen = document.getElementById('btn-open-review-form');
    const formCard = document.getElementById('review-form-card');
    const btnCancel = document.getElementById('btn-cancel-review');
    const form = document.getElementById('add-review-form');
    const ratingBtns = document.querySelectorAll('.star-rating-btn');
    const ratingInput = document.getElementById('review-rating-val');

    if (btnOpen && formCard) {
        btnOpen.addEventListener('click', () => {
            formCard.style.display = formCard.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (btnCancel && formCard) {
        btnCancel.addEventListener('click', () => {
            formCard.style.display = 'none';
        });
    }

    if (ratingBtns && ratingInput) {
        ratingBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const selectedVal = Number(btn.getAttribute('data-rating'));
                ratingInput.value = selectedVal;
                ratingBtns.forEach((b) => {
                    const bVal = Number(b.getAttribute('data-rating'));
                    b.style.color = bVal <= selectedVal ? '#f59e0b' : '#cbd5e1';
                });
            });
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rating = Number(document.getElementById('review-rating-val').value) || 5;
            const title = document.getElementById('review-title').value.trim();
            const comment = document.getElementById('review-comment').value.trim();

            if (!comment) {
                alert("Please provide review comments");
                return;
            }

            const btnSubmit = document.getElementById('btn-submit-review');
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerText = "Submitting...";
            }

            try {
                const result = await postReview({
                    productId,
                    rating,
                    title,
                    comment,
                    customerName: getCurrentUserDisplayName()
                });

                if (result.success) {
                    if (window.showCustomAlert) window.showCustomAlert("Thank you! Your review has been submitted.");
                    else alert("Thank you! Your review has been submitted.");
                    form.reset();
                    if (formCard) formCard.style.display = 'none';
                    await loadAndRenderReviews(productId);
                } else {
                    alert(result.message || "Failed to submit review");
                }
            } catch (err) {
                console.error("Error submitting review:", err);
                alert(err.message || "Failed to submit review. Please ensure you are logged in.");
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = "Submit Review";
                }
            }
        });
    }
}

