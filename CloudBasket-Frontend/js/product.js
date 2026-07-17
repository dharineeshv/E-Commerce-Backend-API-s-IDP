import { apiFetch } from "./api/apiClient.js";

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

    product = allProducts.find(p => (p.productId || p.id) === productId);

    if (!product) {
        document.getElementById('pd-title').innerText = "Product Not Found";
        return;
    }

    renderProductDetails(product);
    renderSimilarProducts(product, allProducts);
    setupTabs();
    
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
    const imageUrl = product.imageUrl || product.image || 'https://via.placeholder.com/600';
    const discount = product.discountPercentage || product.discount || 0;
    const originalPrice = product.mrp || (price / (1 - (discount/100))).toFixed(2);
    const sku = product.sku || `CB-${(product.productId || product.id).toUpperCase().substring(0,6)}-${category.substring(0,3).toUpperCase()}`;
    const desc = product.description || "No description available.";
    
    // Breadcrumbs
    document.getElementById('bc-category').innerText = category;
    document.getElementById('bc-title').innerText = title;

    // Image
    document.getElementById('pd-image').src = imageUrl;

    // Meta
    document.getElementById('pd-sku').innerText = `SKU: ${sku}`;
    
    // Title
    document.getElementById('pd-title').innerText = title;

    // Pricing
    document.getElementById('pd-price').innerText = `₹${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    if (discount > 0) {
        const mrpEl = document.getElementById('pd-mrp');
        mrpEl.innerText = `₹${Number(originalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        mrpEl.style.display = 'inline';
        
        const discEl = document.getElementById('pd-discount');
        discEl.innerText = `-${discount}%`;
        discEl.style.display = 'inline';
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
    
    // Filter by same category, exclude current
    let similar = allProducts.filter(p => 
        (p.category || '').toLowerCase() === (currentProduct.category || '').toLowerCase() && 
        (p.productId || p.id) !== (currentProduct.productId || currentProduct.id)
    );
    
    // Take up to 4
    similar = similar.slice(0, 4);
    
    grid.innerHTML = '';
    
    if (similar.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 40px 0;">No similar products found in this category.</div>';
        return;
    }
    
    similar.forEach(product => {
        const id = product.productId || product.id || Math.random().toString(36).substr(2, 9);
        const title = product.name || product.title;
        const price = product.sellingPrice || product.price;
        const imageUrl = product.imageUrl || product.image || 'https://via.placeholder.com/250';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.textAlign = 'center';
        
        card.innerHTML = `
            <div class="card-img-container" style="background: white; padding: 15px; border-bottom: 1px solid #f1f5f9;">
                <img src="${imageUrl}" alt="${title}" style="max-height: 180px; object-fit: contain;">
            </div>
            <div class="card-body" style="padding: 20px;">
                <h3 class="card-title" style="margin-bottom: 15px; font-size: 16px; min-height: 40px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${title}</h3>
                <div style="font-size: 22px; font-weight: 700; color: #0f4a8a; margin-bottom: 15px;">₹${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <button class="btn" style="width: 100%; background: white; border: 1px solid #cbd5e1; color: #475569; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;" onclick="window.location.href='product.html?id=${id}'">
                    View Details
                </button>
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
