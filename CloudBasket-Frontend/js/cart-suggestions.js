import { apiFetch } from "./api/apiClient.js";

document.addEventListener("DOMContentLoaded", () => {
    loadSuggestedProducts();
});

async function loadSuggestedProducts() {
    const grid = document.getElementById('suggested-products-grid');
    if (!grid) return;

    try {
        // 1. Fetch Cart to know what's inside
        const cartRes = await apiFetch('https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/cart');
        let cartItems = [];
        if (cartRes.ok) {
            const data = await cartRes.json();
            cartItems = data.data && data.data.items ? data.data.items : (data.items || []);
        }

        const cartProductIds = cartItems.map(item => item.productId || item.id);

        // 2. Fetch all products
        const productsRes = await fetch('https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com/api/v1/products');
        if (!productsRes.ok) throw new Error("Failed to fetch products");
        
        const productsData = await productsRes.json();
        let allProducts = productsData.products || productsData.data || productsData;
        if (!Array.isArray(allProducts)) {
            allProducts = [];
        }

        // 3. Find categories of items currently in cart
        const cartCategories = new Set();
        cartItems.forEach(cartItem => {
            // Check if cart item has category directly
            if (cartItem.category) {
                cartCategories.add(cartItem.category);
            } else {
                // Find in allProducts
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

        // 5. If no specific category matches or cart is empty, fallback to the top products from the DB
        if (suggested.length === 0) {
            suggested = allProducts.filter(p => {
                const id = p.productId || p.id;
                return !cartProductIds.includes(id);
            });
            // DO NOT shuffle so it matches the top 4 products in the categories page
        }

        // Display up to 4 items
        suggested = suggested.slice(0, 4);
        grid.innerHTML = '';

        if (suggested.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">No suggestions available right now.</p>';
            return;
        }

        suggested.forEach(product => {
            const id = product.productId || product.id;
            const title = product.name || product.title;
            const price = product.sellingPrice || product.price;
            const imageUrl = product.imageUrl || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';

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
                    <button class="view-details-btn" onclick="window.location.href='product.html?id=${id}'">
                        View Details
                    </button>
                </div>
            `;
            
            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Failed to load suggested products from DB:", error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">Failed to load suggestions. Please try again later.</p>';
    }
}
