// JS for CloudBasket Home Page (storefront)
import { apiFetch } from "./api/apiClient.js";

let allProducts = [];
let filteredProducts = [];
const CUSTOMER_ID = 'cust-001'; // Default test customer

document.addEventListener("DOMContentLoaded", () => {
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

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(searchInput) searchInput.value = '';
            if(categoryFilter) categoryFilter.value = '';
            if(sortFilter) sortFilter.value = 'relevance';
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

    filteredProducts = allProducts.filter(product => {
        const title = (product.name || product.title || '').toLowerCase();
        const desc = (product.description || '').toLowerCase();
        const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm);
        
        const prodCategory = (product.category || 'CATEGORY').toLowerCase();
        const matchesCategory = category === '' || prodCategory === category.toLowerCase();

        return matchesSearch && matchesCategory;
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
        const imageUrl = product.imageUrl || product.image || 'https://via.placeholder.com/250';
        const discount = product.discountPercentage || product.discount || (Math.floor(Math.random() * 20) + 5);
        const originalPrice = product.mrp || (price / (1 - (discount/100))).toFixed(2);
        
        const stars = renderStars(product.rating || (4 + Math.random()));
        const reviews = product.reviews || Math.floor(Math.random() * 500) + 20;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-img-container">
                <span class="discount-badge">-${discount}%</span>
                <img src="${imageUrl}" alt="${title}">
                <button class="quick-view-btn" data-product-id="${id}">Quick View</button>
            </div>
            <div class="card-body">
                <span class="card-category">${category}</span>
                <h3 class="card-title">${title}</h3>
                <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <div class="price-block">
                        <span class="old-price">₹${originalPrice}</span>
                        <span class="new-price">₹${Number(price).toFixed(2)}</span>
                    </div>
                    <button class="cart-btn" aria-label="Add to cart" data-product-id="${id}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Add To Cart Event Listener
        const btn = card.querySelector('.cart-btn');
        btn.addEventListener('click', () => addToCart(id, title));
        
        // Add View Product Event Listener
        const quickViewBtn = card.querySelector('.quick-view-btn');
        quickViewBtn.addEventListener('click', () => viewProduct(product));
        
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
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHtml += '★';
        } else if (i - 0.5 <= rating) {
            starsHtml += '★';
        } else {
            starsHtml += '☆';
        }
    }
    return starsHtml;
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
        const response = await fetch('https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/marketing/festival-sales/active');
        if (response.ok) {
            const data = await response.json();
            const banner = document.getElementById('marketing-banner');
            const badge = document.getElementById('banner-badge');
            const text = document.getElementById('banner-text');
            
            if (data && data.success && data.data) {
                const sale = data.data;
                
                // 1. Update the small top banner
                if (banner && badge && text) {
                    badge.innerText = sale.festivalName || 'SPECIAL SALE';
                    text.innerText = `${sale.discountPercentage}% OFF! Use code ${sale.couponCode} at checkout.`;
                    banner.classList.add('visible');
                }
                
                // 2. Add image to hero slider dynamically
                const sliderWrapper = document.getElementById('store-slider');
                if (sliderWrapper && sale.bannerImageUrl) {
                    const slide = document.createElement('div');
                    slide.className = 'store-slide';
                    slide.style.backgroundImage = `url('${sale.bannerImageUrl}')`;
                    slide.innerHTML = `
                        <div class="slide-overlay"></div>
                        <div class="store-slide-content">
                            <span class="badge badge-orange">FESTIVAL SALE</span>
                            <h2>${sale.festivalName || 'Special Offer'}</h2>
                            <p>${sale.description || `Get ${sale.discountPercentage}% OFF with code ${sale.couponCode}`}</p>
                            <button class="btn btn-orange" onclick="document.getElementById('marketing-banner').scrollIntoView({behavior: 'smooth'})">Shop Sale</button>
                        </div>
                    `;
                    
                    // Prepend it so it shows first
                    sliderWrapper.insertBefore(slide, sliderWrapper.firstChild);
                    
                    // Reset active states
                    const allSlides = sliderWrapper.querySelectorAll('.store-slide');
                    allSlides.forEach(s => s.classList.remove('active'));
                    slide.classList.add('active'); // Make the new slide immediately active
                }
            }
        }
} catch (error) {
        console.error("Failed to fetch marketing banner", error);
    }
}

// ==========================================
// Product View Modal (Now redirects to dedicated page)
// ==========================================
function viewProduct(product) {
    const id = product.productId || product.id;
    if (id) {
        window.location.href = `product.html?id=${id}`;
    }
}
