import { apiFetch } from "./api/apiClient.js";
import { fetchProductReviews } from "./api/reviewApi.js";

let userWishlistIds = new Set();
let CUSTOMER_ID = 'cust-001';
try {
    const token = localStorage.getItem('idToken') || localStorage.getItem('accessToken');
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub && typeof payload.sub === 'string') {
            CUSTOMER_ID = encodeURIComponent(String(payload.sub).replace(/[^a-zA-Z0-9_-]/g, ''));
        }
    }
} catch (e) {}

if (CUSTOMER_ID && CUSTOMER_ID !== 'cust-001') {
    const safeCustomerId = encodeURIComponent(String(CUSTOMER_ID).replace(/[^a-zA-Z0-9_-]/g, ''));
    apiFetch(`https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/wishlist/${safeCustomerId}`)
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

function renderStarRating(rating) {
    const r = Math.min(5, Math.max(0, Number(rating) || 0));
    const fullStars = Math.floor(r);
    const hasHalf = (r - fullStars) >= 0.5;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += 'â˜…';
    if (hasHalf && fullStars < 5) stars += 'â˜…';
    const emptyCount = 5 - fullStars - (hasHalf ? 1 : 0);
    for (let i = 0; i < emptyCount; i++) stars += 'â˜†';
    return stars;
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
            const safeCustomerId = encodeURIComponent(String(CUSTOMER_ID).replace(/[^a-zA-Z0-9_-]/g, ''));
            const safeProdId = encodeURIComponent(String(id).replace(/[^a-zA-Z0-9_-]/g, ''));
            const response = await apiFetch(`https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/wishlist/${safeCustomerId}/${safeProdId}`, {
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
            const response = await apiFetch(`https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/wishlist`, {
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

async function addToCart(productId, productName) {
    try {
        const response = await apiFetch(`https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/cart`, {
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
            window.location.reload();
        } else {
            if (window.showCustomAlert) window.showCustomAlert(`Failed to add to cart: ${data.message || 'Unknown error'}`);
            else alert(`Failed to add to cart: ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadSuggestedProducts();
});

async function loadSuggestedProducts() {
    const grid = document.getElementById('suggested-products-grid');
    if (!grid) return;

    try {
        // 1. Fetch Cart to know what's inside
        let cartItems = [];
        try {
            const cartRes = await apiFetch('https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/cart');
            if (cartRes && cartRes.ok) {
                const data = await cartRes.json();
                cartItems = data.data && data.data.items ? data.data.items : (data.items || []);
            }
        } catch (e) {
            console.warn("Could not fetch cart items for suggestions:", e);
        }

        const cartProductIds = cartItems.map(item => item.productId || item.id);

        // 2. Fetch all products
        const productsRes = await fetch('https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/products');
        if (!productsRes.ok) throw new Error("Failed to fetch products");
        
        const productsData = await productsRes.json();
        let allProducts = productsData.products || productsData.data || productsData;
        if (!Array.isArray(allProducts)) {
            allProducts = [];
        }

        // 3. Find categories of items currently in cart
        const cartCategories = new Set();
        cartItems.forEach(cartItem => {
            if (cartItem.category) {
                cartCategories.add(cartItem.category);
            } else {
                const fullProduct = allProducts.find(p => (p.productId || p.id) === (cartItem.productId || cartItem.id));
                if (fullProduct && fullProduct.category) {
                    cartCategories.add(fullProduct.category);
                }
            }
        });

        // 4. Filter products based on categories (excluding items already in cart)
        let suggested = allProducts.filter(p => {
            const id = p.productId || p.id;
            return cartCategories.has(p.category) && !cartProductIds.includes(id);
        });

        // 5. Fallback to top products if no specific category matches
        if (suggested.length === 0) {
            suggested = allProducts.filter(p => {
                const id = p.productId || p.id;
                return !cartProductIds.includes(id);
            });
        }

        // Display up to 4 items
        suggested = suggested.slice(0, 4);
        grid.innerHTML = '';

        if (suggested.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">No suggestions available right now.</p>';
            return;
        }

        // Fetch review summaries for suggested products
        await Promise.all(suggested.map(async (product) => {
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

        suggested.forEach(product => {
            const id = product.productId || product.id;
            const title = product.name || product.title;
            const category = product.category || 'CATEGORY';
            const price = product.sellingPrice || product.price;
            const rating = product.rating || 4.5;
            const reviewsCount = product.reviewsCount !== undefined ? product.reviewsCount : (product.reviews || 0);

            let imageUrl = product.imageUrl || product.image;
            if (imageUrl && imageUrl.includes('amazonaws.com')) {
                try {
                    const parsed = new URL(imageUrl);
                    imageUrl = `https://cloudbasket-products-personal-dhari.s3.ap-southeast-1.amazonaws.com${parsed.pathname}`;
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

            // Stock badge evaluation
            const qty = product.quantity !== undefined ? Number(product.quantity) : (product.stockQuantity !== undefined ? Number(product.stockQuantity) : (product.stock !== undefined ? Number(product.stock) : null));
            const lowStockThreshold = Number(product.lowStockThreshold || 10);
            const isLowStock = product.isLowStock || (qty !== null && qty > 0 && qty <= lowStockThreshold) || (product.stockStatus === 'low_stock');
            const isOutOfStock = (qty !== null && qty === 0) || (product.stockStatus === 'out_of_stock');

            let stockBadgeHtml = '';
            if (isOutOfStock) {
                stockBadgeHtml = `<div style="position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; z-index: 2;">Out of Stock</div>`;
            } else if (isLowStock) {
                stockBadgeHtml = `<div style="position: absolute; top: 10px; left: 10px; background: #dc2626; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; z-index: 2;">Low Stock</div>`;
            }

            const isInWishlist = userWishlistIds.has(id);
            const heartColor = isInWishlist ? '#ef4444' : '#64748b';
            const heartFill = isInWishlist ? '#ef4444' : 'none';

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
                        <button class="add-to-cart-btn" data-product-id="${id}" data-product-name="${title.replace(/"/g, '&quot;')}" style="background: #0f3d7a; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s, background 0.2s;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"></path></svg>
                        </button>
                    </div>
                </div>
            `;
            
            // Add To Cart Event Listener
            const addToCartBtn = card.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToCart(id, title);
                });
            }
            
            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Failed to load suggested products from DB:", error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">Failed to load suggestions. Please try again later.</p>';
    }
}
