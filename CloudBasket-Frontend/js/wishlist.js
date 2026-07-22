import { getWishlist, removeProductFromWishlist } from './api/wishlistApi.js';
import { apiFetch } from './api/apiClient.js';

let customerId = null;
let wishlistItems = [];

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    if (customerId) {
        await loadWishlist();
    }
});

function checkAuth() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        customerId = payload.sub;
    } catch (e) {
        console.error("Failed to parse token", e);
        window.location.href = 'login.html';
    }
}

async function loadWishlist() {
    const grid = document.getElementById('wishlist-grid');
    const emptyMessage = document.getElementById('empty-wishlist-message');
    const suggestedSection = document.getElementById('suggested-section');
    
    try {
        const response = await getWishlist(customerId);
        wishlistItems = response.items || [];
        
        if (wishlistItems.length === 0) {
            grid.innerHTML = '';
            emptyMessage.style.display = 'block';
            suggestedSection.style.display = 'block';
            loadSuggestedProducts([]);
            return;
        }
        
        emptyMessage.style.display = 'none';
        suggestedSection.style.display = 'block';
        
        renderWishlistItems(wishlistItems);
        loadSuggestedProducts(wishlistItems);
    } catch (error) {
        console.error("Failed to load wishlist:", error);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">Failed to load wishlist. Please try again later.</div>';
    }
}

function renderWishlistItems(items) {
    const grid = document.getElementById('wishlist-grid');
    grid.innerHTML = '';
    
    items.forEach(item => {
        const product = item.productDetails;
        if (!product) return;
        
        const id = product.productId || product.id || item.productId;
        const title = product.name || product.title || 'Unnamed Product';
        const category = product.category || 'Category';
        const price = product.sellingPrice || product.price || 0;
        const imageUrl = product.imageUrl || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
        
        const quantity = Number(product.quantity || 100);
        const lowStockThreshold = Number(product.lowStockThreshold || 20);
        
        let stockBadge = '<span class="stock-badge">In Stock</span>';
        if (quantity === 0) {
            stockBadge = '<span class="stock-badge low-stock">Out of Stock</span>';
        } else if (quantity <= lowStockThreshold) {
            stockBadge = '<span class="stock-badge low-stock">Low Stock</span>';
        }
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-img-container">
                <button class="wishlist-btn" data-product-id="${id}" title="Remove from wishlist" style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-icon">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
                <img src="${imageUrl}" alt="${title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';">
                <button class="quick-view-btn" data-product-id="${id}">Quick View</button>
            </div>
            <div class="card-body">
                <div class="card-category">${category}</div>
                <h3 class="card-title">${title}</h3>
                <div class="card-footer">
                    <div class="price-block">
                        <span class="new-price">\u20B9${Number(price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <button class="add-to-cart-icon-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    </button>
                </div>
            </div>
        `;
        
        // Remove from wishlist
        const removeBtn = card.querySelector('.wishlist-btn');
        removeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                // Optimistic UI update
                card.style.opacity = '0.5';
                card.style.pointerEvents = 'none';
                
                await removeProductFromWishlist(customerId, id);
                
                card.remove();
                
                // Re-fetch to ensure consistency if grid is now empty
                const remainingCards = grid.querySelectorAll('.saved-product-card');
                if (remainingCards.length === 0) {
                    loadWishlist();
                }
            } catch (error) {
                console.error("Failed to remove from wishlist:", error);
                alert("Failed to remove item. Please try again.");
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            }
        });

        // Add to Cart Event Listener
        const cartBtn = card.querySelector('.add-to-cart-icon-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    cartBtn.style.opacity = '0.5';
                    
                    const response = await apiFetch(`https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/cart`, {
                        method: 'POST',
                        body: JSON.stringify({
                            productId: id,
                            quantity: 1
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        cartBtn.style.background = '#10b981';
                        if (window.showCustomAlert) window.showCustomAlert(`Successfully added ${title} to cart!`);
                        else alert(`Successfully added ${title} to cart!`);
                        setTimeout(() => {
                            cartBtn.style.background = '';
                            cartBtn.style.opacity = '1';
                        }, 2000);
                    } else {
                        if (window.showCustomAlert) window.showCustomAlert(`Failed to add to cart: ${data.message || 'Unknown error'}`);
                        else alert(`Failed to add to cart: ${data.message || 'Unknown error'}`);
                        throw new Error("Failed to add");
                    }
                } catch (error) {
                    console.error("Cart error:", error);
                    cartBtn.style.background = '#ef4444';
                    setTimeout(() => {
                        cartBtn.style.background = '';
                        cartBtn.style.opacity = '1';
                    }, 2000);
                }
            });
        }
        
        // Add View Details Event Listener
        const quickViewBtn = card.querySelector('.quick-view-btn');
        if (quickViewBtn) {
            quickViewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `product.html?id=${id}`;
            });
        }
        
        // Clicking anywhere on card views product
        card.addEventListener('click', () => {
            window.location.href = `product.html?id=${id}`;
        });
        
        grid.appendChild(card);
    });
}

async function loadSuggestedProducts(currentWishlist) {
    const suggestedGrid = document.getElementById('suggested-grid');
    if (!suggestedGrid) return;
    
    try {
        const response = await fetch('https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/products');
        const data = await response.json();
        
        let allProducts = data.success ? data.products : (data || []);
        if (!allProducts || allProducts.length === 0) {
            return; // No products to suggest
        }
        
        // Extract categories and brands from current wishlist
        const wishlistCategories = new Set();
        const wishlistBrands = new Set();
        const wishlistIds = new Set();
        
        currentWishlist.forEach(item => {
            const p = item.productDetails;
            if (!p) return;
            wishlistIds.add(p.productId || p.id);
            if (p.category) wishlistCategories.add(p.category.toLowerCase());
            if (p.brand) wishlistBrands.add(p.brand.toLowerCase());
        });
        
        // Filter out items already in wishlist
        let availableProducts = allProducts.filter(p => !wishlistIds.has(p.productId || p.id));
        
        // Prioritize items that match category or brand
        let suggested = availableProducts.filter(p => {
            const catMatch = p.category && wishlistCategories.has(p.category.toLowerCase());
            const brandMatch = p.brand && wishlistBrands.has(p.brand.toLowerCase());
            return catMatch || brandMatch;
        });
        
        // If not enough suggestions, fill with random products
        if (suggested.length < 4) {
            const remaining = availableProducts.filter(p => !suggested.includes(p));
            // Shuffle remaining
            remaining.sort(() => 0.5 - Math.random());
            suggested = [...suggested, ...remaining.slice(0, 4 - suggested.length)];
        }
        
        // Take exactly 4
        suggested = suggested.slice(0, 4);
        
        // Render
        suggestedGrid.innerHTML = '';
        suggested.forEach(product => {
            const id = product.productId || product.id;
            const title = product.name || product.title;
            let imageUrl = product.imageUrl || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
            if (imageUrl.includes('cloudbasket-products-images.s3.ap-southeast-1.amazonaws.com')) {
                imageUrl = imageUrl.replace('cloudbasket-products-images.s3.ap-southeast-1.amazonaws.com', 'd2vghmouksu39n.cloudfront.net');
            }
            const price = Number(product.sellingPrice || product.price || 0).toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR'
            });
            
            const card = document.createElement('div');
            card.style.cssText = 'background: white; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; cursor: pointer; transition: transform 0.2s;';
            card.onmouseover = () => card.style.transform = 'translateY(-4px)';
            card.onmouseout = () => card.style.transform = 'translateY(0)';
            
            card.innerHTML = `
                <div style="height: 180px; display: flex; justify-content: center; align-items: center; margin-bottom: 16px;">
                    <img src="${imageUrl}" alt="${title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                </div>
                <h4 style="font-size: 14px; margin: 0 0 8px 0; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</h4>
                <div style="font-weight: 700; color: #00478f; margin-bottom: 16px;">${price}</div>
                <button class="suggested-view-btn" style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; background: white; color: #00478f; border-radius: 4px; font-size: 12px; cursor: pointer; text-align: center; margin-top: auto; transition: background 0.2s;">View Details</button>
            `;
            
            card.addEventListener('click', () => {
                window.location.href = 'product.html?id=' + id;
            });
            
            const btn = card.querySelector('.suggested-view-btn');
            btn.onmouseover = () => btn.style.background = '#f8fafc';
            btn.onmouseout = () => btn.style.background = 'white';
            
            suggestedGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error("Failed to load suggested products:", error);
    }
}
