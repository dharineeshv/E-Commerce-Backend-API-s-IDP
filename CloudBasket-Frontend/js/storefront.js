// JS for CloudBasket Home Page (storefront)
import { apiFetch } from "./api/apiClient.js";
import { getActiveFestivalSale } from "./api/marketingApi.js";
import { fetchProductReviews } from "./api/reviewApi.js";

let allProducts = [];
let filteredProducts = [];
let userWishlistIds = new Set();
let activeFestivalSale = null;
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
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const festRes = await getActiveFestivalSale();
        if (festRes && festRes.success && festRes.data) {
            const sale = festRes.data;
            const now = Date.now();
            const isStatusActive = (sale.status || '').toUpperCase() === 'ACTIVE';
            const startDate = sale.startDate ? new Date(sale.startDate).getTime() : 0;
            const endDate = sale.endDate ? new Date(sale.endDate).getTime() : Infinity;

            if (isStatusActive && now >= startDate && now <= endDate) {
                activeFestivalSale = sale;
            } else {
                activeFestivalSale = null;
            }
        } else {
            activeFestivalSale = null;
        }
    } catch (e) {
        console.error("Failed to load festival sale", e);
        activeFestivalSale = null;
    }
    initSlider();
    loadProducts();
    setupFilters();
    loadMarketingBanner();
});

function initSlider() {
    let currentSlide = 0;
    
    // Automatically switch slide every 5 seconds
    setInterval(() => {
        const slides = document.querySelectorAll('.store-slide');
        if (slides.length === 0) return;
        
        slides.forEach(s => s.classList.remove('active'));
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

async function loadProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    try {
        const response = await fetch('https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/products');
        const data = await response.json();
        
        if (data.success && data.products) {
            allProducts = data.products;
        } else {
            allProducts = data; // Fallback in case response is a direct array
        }

        // If backend returns nothing, fallback to mock data
        if (!allProducts || allProducts.length === 0) {
            console.warn("No products found from backend. Using mock data.");
            allProducts = getMockProducts();
        }

        if (CUSTOMER_ID && CUSTOMER_ID !== 'cust-001') {
            try {
                const wishRes = await apiFetch(`https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/wishlist/${CUSTOMER_ID}`);
                if (wishRes.ok) {
                    const wishData = await wishRes.json();
                    if (wishData.items) {
                        wishData.items.forEach(item => {
                            if (item.productDetails && (item.productDetails.productId || item.productDetails.id)) {
                                userWishlistIds.add(item.productDetails.productId || item.productDetails.id);
                            } else if (item.productId) {
                                userWishlistIds.add(item.productId);
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("Error fetching initial wishlist", e);
            }
        }

        // Fetch review/rating data for products asynchronously
        await Promise.all(allProducts.map(async (product) => {
            const pId = product.productId || product.id;
            if (pId) {
                try {
                    const revRes = await fetchProductReviews(pId);
                    if (revRes && revRes.summary) {
                        product.rating = revRes.summary.averageRating || product.rating || 4.5;
                        product.reviewsCount = revRes.summary.totalReviews !== undefined ? revRes.summary.totalReviews : (product.reviews || 0);
                    }
                } catch (e) {
                    console.error("Error fetching rating summary for product", pId, e);
                }
            }
            if (!product.rating) {
                product.rating = 4.5;
                product.reviewsCount = product.reviews || 8;
            }
        }));

        filteredProducts = [...allProducts];
        renderProducts(filteredProducts);
    } catch (error) {
        console.error("Failed to fetch real products, falling back to mock.", error);
        allProducts = getMockProducts();
        filteredProducts = [...allProducts];
        renderProducts(filteredProducts);
    }
}

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const priceFilter = document.getElementById('price-filter');
    const clearBtn = document.getElementById('clear-filters');

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', applyFilters);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(searchInput) searchInput.value = '';
            if(categoryFilter) categoryFilter.value = '';
            if(sortFilter) sortFilter.value = 'relevance';
            if(priceFilter) priceFilter.value = '';
            applyFilters();
        });
    }
}

function applyFilters() {
    let searchTerm = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchTerm = searchInput.value.toLowerCase();
    }

    let category = '';
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        category = categoryFilter.value;
    }
    
    let sortBy = 'relevance';
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortBy = sortFilter.value;
    }

    let priceRange = '';
    const priceFilter = document.getElementById('price-filter');
    if (priceFilter) {
        priceRange = priceFilter.value;
    }

    filteredProducts = allProducts.filter(product => {
        const title = (product.name || product.title || '').toLowerCase();
        const desc = (product.description || '').toLowerCase();
        const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm);
        
        const prodCategory = (product.category || 'CATEGORY').toLowerCase();
        const matchesCategory = category === '' || prodCategory === category.toLowerCase();

        let matchesPrice = true;
        if (priceRange !== '') {
            const productPrice = Number(product.sellingPrice || product.price) || 0;
            if (priceRange === '10000+') {
                matchesPrice = productPrice >= 10000;
            } else {
                const parts = priceRange.split('-');
                if (parts.length === 2) {
                    const min = Number(parts[0]);
                    const max = Number(parts[1]);
                    matchesPrice = productPrice >= min && productPrice <= max;
                }
            }
        }

        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    if (sortBy === 'price-low') {
        filteredProducts.sort((a, b) => (Number(a.sellingPrice || a.price) || 0) - (Number(b.sellingPrice || b.price) || 0));
    } else if (sortBy === 'price-high') {
        filteredProducts.sort((a, b) => (Number(b.sellingPrice || b.price) || 0) - (Number(a.sellingPrice || a.price) || 0));
    }

    renderProducts(filteredProducts);
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Update count display
    const countDisplay = document.getElementById('product-count-display');
    if (countDisplay) {
        countDisplay.innerHTML = `Showing ${products.length} <span class="count-light">of ${allProducts.length} products</span>`;
    }
    
    products.forEach(product => {
        // Handle backend DynamoDB or mock data fields
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

        const discount = product.discountPercentage || product.discount || (Math.floor(Math.random() * 20) + 5);
        let originalPrice = product.mrp || (price / (1 - (discount/100))).toFixed(2);
        
        // Stock badge evaluation (only show if stock is low or out of stock)
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
        
        let currentPrice = Number(price);
        let festivalLabel = '';
        if (activeFestivalSale) {
            if (activeFestivalSale.discountType === 'percentage' || activeFestivalSale.discountType === 'PERCENTAGE') {
                currentPrice = currentPrice * (1 - (activeFestivalSale.discountValue / 100));
            } else {
                currentPrice = Math.max(0, currentPrice - activeFestivalSale.discountValue);
            }
            if (currentPrice < Number(price)) {
                festivalLabel = `<div style="font-size: 0.7em; color: #ef4444; font-weight: bold; margin-top: 2px;">(Festival Sale)</div>`;
                // Set the original price to the normal selling price if there's a festival sale
                originalPrice = Number(price).toFixed(2);
            }
        }
        
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
                    <span class="rating-stars" style="color: #f59e0b; font-size: 0.85rem; letter-spacing: 1px;">${renderStars(rating)}</span>
                    <span class="rating-val" style="font-size: 0.75rem; font-weight: 600; color: #475569; margin-left: 2px;">${Number(rating).toFixed(1)}</span>
                    <span class="rating-count" style="font-size: 0.7rem; color: #94a3b8;">(${reviewsCount})</span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto;">
                    <div class="price-block" style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.8rem; color: #94a3b8; text-decoration: line-through;">\u20B9${originalPrice}</span>
                        <span class="new-price" style="font-size: 1.1rem; font-weight: 700; color: #0f3d7a;">\u20B9${Number(currentPrice).toFixed(2)}</span>
                        ${festivalLabel}
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
            window.showCustomAlert(`Successfully added ${productName} to cart!`);
            // Optionally fetch cart data here to update header badge
        } else {
            window.showCustomAlert(`Failed to add to cart: ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        window.showCustomAlert("An error occurred while connecting to the Cart Service. Is it running?");
    }
}

function renderStars(rating) {
    const r = Math.min(5, Math.max(0, Number(rating) || 0));
    const fullStars = Math.floor(r);
    const hasHalf = (r - fullStars) >= 0.5;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (hasHalf && fullStars < 5) stars += '★';
    const emptyCount = 5 - fullStars - (hasHalf ? 1 : 0);
    for (let i = 0; i < emptyCount; i++) stars += '☆';
    return stars;
}

function getMockProducts() {
    return [
        {
            productId: "mock-1",
            title: "ProVision Elite Smartphone 512GB Space Black",
            category: "ELECTRONICS",
            price: 1099.00,
            imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80",
            discount: 15,
            rating: 4.8,
            reviews: 128
        },
        {
            productId: "mock-2",
            title: "SonicFlow Studio Wireless Headphones - Midnight Navy",
            category: "ELECTRONICS", // Mapped from AUDIO
            price: 349.00,
            imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
            discount: 10,
            rating: 4.5,
            reviews: 342
        },
        {
            productId: "mock-3",
            title: "AeroPrecision Smart Electric Kettle 1.7L",
            category: "HOME",
            price: 129.00,
            imageUrl: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=500&q=80",
            discount: 20,
            rating: 4.7,
            reviews: 89
        },
        {
            productId: "mock-4",
            title: "UltraVision 4K Professional Designer Display 32\"",
            category: "ELECTRONICS",
            price: 799.00,
            imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80",
            discount: 12,
            rating: 4.6,
            reviews: 215
        }
    ];
}

async function loadMarketingBanner() {
    try {
        const banner = document.getElementById('marketing-banner');
        const badge = document.getElementById('banner-badge');
        const text = document.getElementById('banner-text');
        
        // 1. Fetch Coupons for Top Orange Banner
        try {
            const couponRes = await fetch('https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/marketing/coupons');
            let bannerShown = false;
            if (couponRes.ok) {
                const couponData = await couponRes.json();
                if (couponData && couponData.success && couponData.data && couponData.data.length > 0) {
                    const now = Date.now();
                    const activeCoupons = couponData.data.filter(c => {
                        const isStatusActive = (c.status || '').toUpperCase() === 'ACTIVE';
                        const startDate = c.startDate ? new Date(c.startDate).getTime() : 0;
                        const expiryDate = c.expiryDate ? new Date(c.expiryDate).getTime() : (c.endDate ? new Date(c.endDate).getTime() : Infinity);
                        const notExpired = now <= expiryDate;
                        const hasStarted = now >= startDate;
                        const notExhausted = (c.usedCount || 0) < (c.usageLimit || Infinity);
                        return isStatusActive && hasStarted && notExpired && notExhausted;
                    });

                    if (activeCoupons.length > 0 && banner && badge && text) {
                        const coupon = activeCoupons[0];
                        badge.innerText = 'SPECIAL COUPON';
                        text.innerText = `${coupon.discountValue}${coupon.discountType === 'percentage' || coupon.discountType === 'PERCENTAGE' ? '%' : ' OFF'}! Use code ${coupon.couponCode} at checkout.`;
                        banner.classList.add('visible');
                        bannerShown = true;
                    }
                }
            }
            if (!bannerShown && banner) {
                banner.classList.remove('visible');
            }
        } catch (e) { 
            console.error("Error loading coupons", e); 
            if (banner) banner.classList.remove('visible');
        }

        // 2. Fetch Festival Sales for Hero Slider
        try {
            const festRes = await fetch('https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/marketing/festival-sales/active');
            const sliderWrapper = document.getElementById('store-slider');
            let festSlideInjected = false;

            if (festRes.ok) {
                const festData = await festRes.json();
                if (festData && festData.success && festData.data) {
                    const sale = festData.data;
                    const now = Date.now();
                    const isStatusActive = (sale.status || '').toUpperCase() === 'ACTIVE';
                    const startDate = sale.startDate ? new Date(sale.startDate).getTime() : 0;
                    const endDate = sale.endDate ? new Date(sale.endDate).getTime() : Infinity;

                    if (isStatusActive && now >= startDate && now <= endDate) {
                        activeFestivalSale = sale;
                        if (sliderWrapper) {
                            const oldFestSlide = document.getElementById('fest-sale-slide');
                            if (oldFestSlide) oldFestSlide.remove();

                            const slide = document.createElement('div');
                            slide.id = 'fest-sale-slide';
                            slide.className = 'store-slide active';
                            
                            const imageUrl = sale.bannerImageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80';
                            const fallbackImg = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80';
                            slide.style.position = 'relative';
                            slide.style.overflow = 'hidden';
                            
                            slide.innerHTML = `
                                <img src="${imageUrl}" onerror="this.onerror=null; this.src='${fallbackImg}';" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;">
                                <div class="slide-overlay" style="z-index: 1; background: linear-gradient(90deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.6) 40%, transparent 100%); width: 100%; height: 100%; position: absolute; top:0; left:0;"></div>
                                <div class="store-slide-content" style="z-index: 2; position: relative; display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding: 0 5%; max-width: 650px;">
                                    
                                    <div style="background: #92400e; color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; margin-bottom: 20px; display: inline-block;">
                                        Limited Time Offer
                                    </div>
                                    
                                    <h2 style="font-size: 1.5rem; font-weight: 700; color: white; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                                        🎉 ${sale.festivalName || sale.title || 'Special Offer'}
                                    </h2>
                                    
                                    <p style="font-size: 1.25rem; color: #f8fafc; line-height: 1.5; margin-bottom: 30px; margin-top: 0;">
                                        Up to ${sale.discountValue}${sale.discountType === 'percentage' || sale.discountType === 'PERCENTAGE' ? '%' : ' OFF'} on all inventory items. Boost your sales today!
                                    </p>
                                    
                                    <div style="display: flex; gap: 15px; margin-bottom: 30px;">
                                        <div style="display: flex; flex-direction: column; align-items: center;">
                                            <div id="fest-days" style="background: rgba(255,255,255,0.75); color: #0f172a; font-size: 1.5rem; font-weight: 700; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 5px;">00</div>
                                            <span style="color: #cbd5e1; font-size: 0.75rem; font-weight: 600; letter-spacing: 1px;">DAYS</span>
                                        </div>
                                        <div style="display: flex; flex-direction: column; align-items: center;">
                                            <div id="fest-hours" style="background: rgba(255,255,255,0.75); color: #0f172a; font-size: 1.5rem; font-weight: 700; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 5px;">00</div>
                                            <span style="color: #cbd5e1; font-size: 0.75rem; font-weight: 600; letter-spacing: 1px;">HOURS</span>
                                        </div>
                                        <div style="display: flex; flex-direction: column; align-items: center;">
                                            <div id="fest-mins" style="background: rgba(255,255,255,0.75); color: #0f172a; font-size: 1.5rem; font-weight: 700; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 5px;">00</div>
                                            <span style="color: #cbd5e1; font-size: 0.75rem; font-weight: 600; letter-spacing: 1px;">MINS</span>
                                        </div>
                                        <div style="display: flex; flex-direction: column; align-items: center;">
                                            <div id="fest-secs" style="background: rgba(255,255,255,0.75); color: #0f172a; font-size: 1.5rem; font-weight: 700; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 5px;">00</div>
                                            <span style="color: #cbd5e1; font-size: 0.75rem; font-weight: 600; letter-spacing: 1px;">SECS</span>
                                        </div>
                                    </div>
                                    
                                    <button class="btn" style="background: #f59e0b; color: #0f172a; font-weight: 700; padding: 12px 32px; border-radius: 25px; border: none; cursor: pointer; font-size: 1rem;" onclick="document.getElementById('product-grid').scrollIntoView({behavior: 'smooth'})">Shop Now</button>
                                </div>
                            `;
                            
                            sliderWrapper.insertBefore(slide, sliderWrapper.firstChild);
                            festSlideInjected = true;
                            
                            // Timer & auto-removal upon expiration
                            const timerInterval = setInterval(() => {
                                const currNow = Date.now();
                                const distance = endDate - currNow;
                                
                                const dEl = document.getElementById('fest-days');
                                const hEl = document.getElementById('fest-hours');
                                const mEl = document.getElementById('fest-mins');
                                const sEl = document.getElementById('fest-secs');
                                
                                if (distance <= 0) {
                                    clearInterval(timerInterval);
                                    if (dEl) dEl.innerText = "00";
                                    if (hEl) hEl.innerText = "00";
                                    if (mEl) mEl.innerText = "00";
                                    if (sEl) sEl.innerText = "00";
                                    
                                    const expiredSlide = document.getElementById('fest-sale-slide');
                                    if (expiredSlide) expiredSlide.remove();
                                    activeFestivalSale = null;
                                    renderProducts(filteredProducts);
                                    return;
                                }

                                if (!dEl || !hEl || !mEl || !sEl) return;
                                
                                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                                
                                dEl.innerText = days.toString().padStart(2, '0');
                                hEl.innerText = hours.toString().padStart(2, '0');
                                mEl.innerText = minutes.toString().padStart(2, '0');
                                sEl.innerText = seconds.toString().padStart(2, '0');
                            }, 1000);
                            
                            const allSlides = sliderWrapper.querySelectorAll('.store-slide');
                            allSlides.forEach((s, idx) => {
                                if (idx !== 0) s.classList.remove('active');
                            });
                        }
                    }
                }
            }

            if (!festSlideInjected) {
                const oldFestSlide = document.getElementById('fest-sale-slide');
                if (oldFestSlide) oldFestSlide.remove();
                activeFestivalSale = null;
            }
        } catch (e) { console.error("Error loading festival sales", e); }
        
    } catch (error) {
        console.error("Error in marketing banner logic", error);
    }
}

// ==========================================
// Product View Modal (Now redirects to dedicated page)
// ==========================================
window.viewProduct = function(productIdOrObj) {
    const id = typeof productIdOrObj === 'string' ? productIdOrObj : (productIdOrObj.productId || productIdOrObj.id);
    if (id) {
        window.location.href = `product.html?id=${id}`;
    }
};

// ==========================================
// Global Wishlist Toggle
// ==========================================
window.toggleWishlist = async function(event, id, btnElement) {
    event.stopPropagation();
    try {
        const isAdded = btnElement.style.color === 'rgb(239, 68, 68)' || btnElement.style.color === '#ef4444';
        if (isAdded) {
            const response = await apiFetch(`https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/wishlist/${CUSTOMER_ID}/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                btnElement.style.color = '#64748b';
                btnElement.style.fill = 'none';
            }
        } else {
            const response = await apiFetch(`https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/wishlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: CUSTOMER_ID, productId: id })
            });
            if (response.ok) {
                btnElement.style.color = '#ef4444';
                btnElement.style.fill = '#ef4444';
            }
        }
    } catch (error) {
        console.error("Error toggling wishlist", error);
    }
};
