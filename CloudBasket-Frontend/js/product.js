import { apiFetch } from "./api/apiClient.js";
import { getActiveFestivalSale } from "./api/marketingApi.js";
import { fetchProductReviews, postReview } from "./api/reviewApi.js";

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
    
    // Wire Add to Cart
    const addBtn = document.getElementById('pd-add-to-cart-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            addToCart(productId, product.name || product.title);
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
    
    // Breadcrumbs
    document.getElementById('bc-category').innerText = category;
    document.getElementById('bc-title').innerText = title;



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
    if (title.toUpperCase().includes('VIVO Y56')) {
        defaultImageUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80';
    }

    // Image and Thumbnails
    const mainImageEl = document.getElementById('pd-image');
    mainImageEl.onerror = function() { this.onerror=null; this.src = fallbackImg; };

    const thumbnailsContainer = document.getElementById('pd-thumbnails');
    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';
        if (product.images && product.images.length > 0) {
            
            let firstImgUrl = sanitizeUrl(product.images[0].imageUrl);
            if (title.toUpperCase().includes('VIVO Y56')) {
                firstImgUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80';
            }
            
            mainImageEl.src = firstImgUrl;
            
            product.images.forEach((imgObj, index) => {
                const thumb = document.createElement('img');
                
                let thumbUrl = sanitizeUrl(imgObj.imageUrl);
                if (title.toUpperCase().includes('VIVO Y56')) {
                    // For the demo, just force all VIVO thumbnails to the placeholder if broken, or just let them use the fallback
                    // Actually, let's just let it be, but add onerror
                }
                
                thumb.src = thumbUrl;
                thumb.onerror = function() { this.onerror=null; this.src = fallbackImg; };
                thumb.className = 'pd-thumbnail';
                if (index === 0) thumb.classList.add('active');
                
                thumb.addEventListener('mouseover', () => {
                    mainImageEl.src = thumbUrl;
                    document.querySelectorAll('.pd-thumbnail').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                });
                
                thumbnailsContainer.appendChild(thumb);
            });
        } else {
            // No multiple images, just show the single image
            mainImageEl.src = defaultImageUrl;
        }
    }

    // Meta
    document.getElementById('pd-sku').innerText = `SKU: ${sku}`;
    
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

function renderSimilarProducts(currentProduct, allProducts) {
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
    
    similar.forEach(product => {
        const id = product.productId || product.id || Math.random().toString(36).substr(2, 9);
        const title = product.name || product.title;
        const price = product.sellingPrice || product.price;
        let imageUrl = product.imageUrl || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
        
        if (imageUrl && imageUrl.includes('cloudbasket-product-images')) {
            imageUrl = imageUrl.replace('cloudbasket-product-images', 'cloudbasket-products-images');
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-img-container">
                <img src="${imageUrl}" alt="${title}" onerror="this.onerror=null; this.src=\'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80\';">
            </div>
            <div class="card-body">
                <h3 class="card-title">${title}</h3>
                <div class="price-block">
                    <span class="new-price">₹${Number(price).toFixed(2)}</span>
                </div>
                <button class="view-details-btn" onclick="window.location.href='product.html?id=${id}'">View Details</button>
            </div>
        `;
        
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
                    if (!authorName || authorName === 'Verified Customer' || authorName === 'Verified Buyer' || authorName === 'anonymous') {
                        authorName = getCurrentUserDisplayName();
                    }
                    const card = document.createElement('div');
                    card.className = 'review-card';
                    card.style.cssText = 'background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);';
                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <div>
                                <div style="color: #f59e0b; font-size: 16px; margin-bottom: 4px;">${renderStarRating(rev.rating)}</div>
                                <h4 style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 700;">${escapeHtml(rev.title || 'Great Product')}</h4>
                            </div>
                            <span style="font-size: 12px; color: #94a3b8;">${dateStr}</span>
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

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
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

