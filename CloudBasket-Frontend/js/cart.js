import { apiFetch } from "./api/apiClient.js";
import { getActiveFestivalSale } from "./api/marketingApi.js";
document.addEventListener('DOMContentLoaded', () => {
    let cartItems = [];
    const cartListContainer = document.getElementById('cart-items-list');
    
    function formatCurrency(value) {
        return '\u20B9' + Number(value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }

    const allProductsMap = new Map();

    function sanitizeUrl(url) {
        if (!url) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
        try {
            if (url.includes('amazonaws.com')) {
                const parsed = new URL(url);
                return `https://cloudbasket-products-personal-dhari.s3.ap-southeast-1.amazonaws.com${parsed.pathname}`;
            }
        } catch (e) {}
        return url;
    }

    async function loadCart() {
        try {
            const prodRes = await fetch('https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/products');
            const prodData = await prodRes.json();
            const list = prodData.products || prodData.data || prodData || [];
            if (Array.isArray(list)) {
                list.forEach(p => {
                    const pId = p.productId || p.id;
                    if (pId) allProductsMap.set(String(pId), p);
                    if (p.name) allProductsMap.set(p.name.toLowerCase().trim(), p);
                    if (p.title) allProductsMap.set(p.title.toLowerCase().trim(), p);
                });
            }
        } catch (e) {}

        try {
            const response = await apiFetch('https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/cart');
            
            if (response.status === 401 || response.status === 403) {
                window.location.href = "login.html";
                return;
            }
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // The cart response data structure
                cartItems = data.data?.items || data.items || data.data || [];
                
                // Apply Festival Sale Discount
                try {
                    const festRes = await getActiveFestivalSale();
                    if (festRes && festRes.success && festRes.data) {
                        const activeSale = festRes.data;
                        cartItems.forEach(item => {
                            let currentPrice = Number(item.price);
                            item.originalPrice = currentPrice;
                            
                            if (activeSale.discountType === 'percentage' || activeSale.discountType === 'PERCENTAGE') {
                                currentPrice = currentPrice * (1 - (activeSale.discountValue / 100));
                            } else {
                                currentPrice = Math.max(0, currentPrice - activeSale.discountValue);
                            }
                            
                            if (currentPrice < item.originalPrice) {
                                item.price = currentPrice;
                                item.isFestivalDiscounted = true;
                            }
                        });
                    }
                } catch (e) {
                    console.error("Failed to load festival sale in cart", e);
                }
                
            } else {
                console.error("Failed to load cart", data);
                cartItems = [];
            }
        } catch (error) {
            console.error("Error fetching cart", error);
            cartItems = [];
        }
        renderCart();
    }

    async function updateQuantity(cartItemId, quantity) {
        try {
            const response = await apiFetch(`https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/cart/${cartItemId}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                loadCart();
            } else {
                if (window.showCustomAlert) window.showCustomAlert(data.message || 'Failed to update quantity');
                else alert(data.message || 'Failed to update quantity');
                loadCart(); // reload to previous state
            }
        } catch (error) {
            if (window.showCustomAlert) window.showCustomAlert('Error updating quantity');
            else alert('Error updating quantity');
        }
    }

    async function removeItem(cartItemId) {
        try {
            const response = await apiFetch(`https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/cart/${cartItemId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (response.ok && data.success) {
                loadCart();
            } else {
                if (window.showCustomAlert) window.showCustomAlert(data.message || 'Failed to remove item');
                else alert(data.message || 'Failed to remove item');
            }
        } catch (error) {
            if (window.showCustomAlert) window.showCustomAlert('Error removing item');
            else alert('Error removing item');
        }
    }

    function renderCart() {
        cartListContainer.innerHTML = '';
        
        if (cartItems.length === 0) {
            cartListContainer.innerHTML = '<div class="cart-item"><p>Your basket is empty.</p></div>';
            updateTotals();
            return;
        }

        cartItems.forEach((item) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            
            // Handle both DynamoDB format and Mock format
            const id = item.cartItemId || item.id || item.productId;
            const title = item.productName || item.title || 'Product';
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            
            const pId = item.productId || item.id;
            const matchedProd = (pId && allProductsMap.get(String(pId))) || (title && allProductsMap.get(title.toLowerCase().trim())) || {};
            
            let rawImg = item.imageUrl || item.image || matchedProd.imageUrl || matchedProd.image;
            if (!rawImg && matchedProd.images && matchedProd.images.length > 0) {
                const firstImg = matchedProd.images[0];
                rawImg = typeof firstImg === 'string' ? firstImg : (firstImg.imageUrl || firstImg.url || firstImg.image);
            }
            
            const imageUrl = sanitizeUrl(rawImg);
            const fallbackImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
            
            itemEl.innerHTML = `
                <div class="cart-item-img">
                    <img src="${imageUrl}" alt="${title}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                </div>
                <div class="cart-item-details">
                    <div class="item-title-row">
                        <div>
                            <h3>${title}</h3>
                        </div>

                     ${item.isFestivalDiscounted ? 
                         `<div class="item-price" style="display:flex; flex-direction:column; align-items:flex-end;">
                            <div>
                                <span style="font-size: 0.8rem; color: #94a3b8; text-decoration: line-through; margin-right: 4px;">${formatCurrency(item.originalPrice)}</span>
                                <span>${formatCurrency(price)}</span>
                            </div>
                            <div style="font-size: 0.7em; color: #ef4444; font-weight: bold; margin-top: 2px;">(Festival Sale)</div>
                          </div>` 
                         : `<div class="item-price">${formatCurrency(price)}</div>`
                     }

                        
                    </div>
                    
                    <div class="item-actions">
                        <div class="quantity-adjuster">
                            <button class="btn-minus" data-id="${id}">âˆ’</button>
                            <span>${quantity}</span>
                            <button class="btn-plus" data-id="${id}">+</button>
                        </div>
                        <button class="btn-remove" data-id="${id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                            </svg>
                            Remove
                        </button>
                    </div>
                </div>
            `;
            cartListContainer.appendChild(itemEl);
        });

        // Add event listeners
        document.querySelectorAll('.btn-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const item = cartItems.find(i => (i.cartItemId || i.id || i.productId) === id);
                if(item) {
                    item.quantity++; // Optimistic UI update
                    renderCart();
                    updateQuantity(id, item.quantity);
                }
            });
        });

        document.querySelectorAll('.btn-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const item = cartItems.find(i => (i.cartItemId || i.id || i.productId) === id);
                if (item && item.quantity > 1) {
                    item.quantity--; // Optimistic UI update
                    renderCart();
                    updateQuantity(id, item.quantity);
                }
            });
        });

        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                removeItem(id);
            });
        });

        updateTotals();
    }

    let appliedCoupon = null;

    async function applyCoupon() {
        const couponInput = document.getElementById('coupon-code-input');
        if (!couponInput) return;
        const code = couponInput.value.trim();
        if (!code) {
            if (window.showCustomAlert) window.showCustomAlert("Please enter a coupon code.");
            else alert("Please enter a coupon code.");
            return;
        }

        if (appliedCoupon) {
            if (window.showCustomAlert) window.showCustomAlert("A coupon has already been applied. Please clear it to use a different one.");
            else alert("A coupon has already been applied. Please clear it to use a different one.");
            return;
        }

        const subtotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

        try {
            // Fetch all coupons from the public endpoint
            const response = await fetch('https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/marketing/coupons');
            const data = await response.json();
            
            if (!response.ok || !data || !data.data) {
                throw new Error("Failed to validate coupon");
            }

            // Find the matching coupon
            const normalizedCode = code.toUpperCase();
            const coupon = data.data.find(c => c.couponCode.toUpperCase() === normalizedCode);

            if (!coupon) {
                if (window.showCustomAlert) window.showCustomAlert("Coupon not found.");
                else alert("Coupon not found.");
                return;
            }

            if (coupon.status !== "ACTIVE") {
                if (window.showCustomAlert) window.showCustomAlert("Coupon is inactive.");
                else alert("Coupon is inactive.");
                return;
            }

            if (new Date() > new Date(coupon.expiryDate)) {
                if (window.showCustomAlert) window.showCustomAlert("Coupon has expired.");
                else alert("Coupon has expired.");
                return;
            }

            if (subtotal < coupon.minimumOrderAmount) {
                if (window.showCustomAlert) window.showCustomAlert(`Minimum order amount is \u20B9${coupon.minimumOrderAmount}.`);
                else alert(`Minimum order amount is \u20B9${coupon.minimumOrderAmount}.`);
                return;
            }

            // Calculate discount locally
            let discount = 0;
            const isPercentage = coupon.discountType && coupon.discountType.toUpperCase().includes("PERCENT");
            
            if (isPercentage) {
                discount = (subtotal * coupon.discountValue) / 100;
                // Ignore maximumDiscount if it equals discountValue (common admin entry error)
                if (coupon.maximumDiscount && coupon.maximumDiscount > 0 && coupon.maximumDiscount !== coupon.discountValue && discount > coupon.maximumDiscount) {
                    discount = coupon.maximumDiscount;
                }
            } else {
                discount = Math.min(coupon.discountValue, subtotal);
            }

            // Success
            appliedCoupon = {
                code: coupon.couponCode,
                discount: discount
            };

            if (window.showCustomAlert) window.showCustomAlert(`Coupon applied successfully! Saved \u20B9${discount.toFixed(2)}`);
            else alert(`Coupon applied successfully! Saved \u20B9${discount.toFixed(2)}`);
            
            updateTotals();
            document.getElementById('coupon-code-input').value = '';
        } catch (error) {
            appliedCoupon = null;
            if (window.showCustomAlert) window.showCustomAlert('Error applying coupon.');
            else alert('Error applying coupon.');
            updateTotals();
        }
    }

    const applyBtn = document.getElementById('btn-apply-coupon');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyCoupon);
    }

    function updateTotals() {
        const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const countDisplay = document.querySelector('.item-count');
        if (countDisplay) {
            countDisplay.textContent = totalItems + (totalItems === 1 ? ' Item' : ' Items');
        }
        
        let subtotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        
        const subtotalDisplay = document.getElementById('summary-subtotal');
        if (subtotalDisplay) subtotalDisplay.textContent = formatCurrency(subtotal);
        
        let total = subtotal;
        let discountDisplay = document.getElementById('summary-discount');
        
        if (appliedCoupon && appliedCoupon.discount) {
            total = subtotal - appliedCoupon.discount;
            if (total < 0) total = 0;
            
            // Add or update discount row
            if (!discountDisplay) {
                const totalLeft = document.querySelector('.summary-total .total-left');
                const totalRight = document.querySelector('.summary-total .total-right');
                
                if (totalLeft && totalRight) {
                    const discountRowLeft = document.createElement('div');
                    discountRowLeft.innerHTML = `<span>Discount (${appliedCoupon.code})</span>`;
                    discountRowLeft.style.color = '#10b981';
                    discountRowLeft.style.marginTop = '8px';
                    discountRowLeft.id = 'discount-row-left';
                    totalLeft.appendChild(discountRowLeft);
                    
                    const discountRowRight = document.createElement('div');
                    discountRowRight.innerHTML = `<span id="summary-discount">-${formatCurrency(appliedCoupon.discount)}</span>`;
                    discountRowRight.style.color = '#10b981';
                    discountRowRight.style.marginTop = '8px';
                    discountRowRight.id = 'discount-row-right';
                    totalRight.insertBefore(discountRowRight, totalRight.firstChild.nextSibling);
                }
            } else {
                discountDisplay.textContent = `-${formatCurrency(appliedCoupon.discount)}`;
                const left = document.getElementById('discount-row-left');
                if (left) left.innerHTML = `<span>Discount (${appliedCoupon.code})</span>`;
            }
        } else {
            // Remove discount row if exists
            const left = document.getElementById('discount-row-left');
            const right = document.getElementById('discount-row-right');
            if (left) left.remove();
            if (right) right.remove();
        }

        const totalDisplay = document.getElementById('summary-total');
        if (totalDisplay) totalDisplay.textContent = formatCurrency(total);
    }

    // Initialize
    loadCart();
});
