import { API } from "./config.js";
import { apiFetch } from './api/apiClient.js';
import { getActiveFestivalSale } from './api/marketingApi.js';
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Existing UI Logic --- //
    // Payment Accordion Logic
    const paymentOptions = document.querySelectorAll('.payment-option');
    const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            // First collapse all
            paymentOptions.forEach(opt => opt.classList.remove('expanded'));
            
            // Expand the selected one
            const selectedOption = e.target.closest('.payment-option');
            if (selectedOption) {
                selectedOption.classList.add('expanded');
            }
        });
    });
    // --- Dynamic Checkout Logic --- //
    const summaryList = document.getElementById('checkout-summary-list');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const taxEl = document.getElementById('checkout-tax');
    const totalEl = document.getElementById('checkout-total');
    const btnPurchase = document.getElementById('btn-complete-purchase');
    let cartItems = [];
    let checkoutTotal = 0;
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

    function formatCurrency(value) {
        return '\u20B9' + Number(value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    let activeFestivalSale = null;
    async function loadCheckoutCart() {
        if (!summaryList) return;
        
        summaryList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Loading your order summary...</p>';

        // 1. Check for Direct Buy Now item in sessionStorage
        const directItemRaw = sessionStorage.getItem('direct_buy_now_item');
        let isDirectBuyNow = false;
        if (directItemRaw) {
            try {
                const directItem = JSON.parse(directItemRaw);
                if (directItem && (directItem.productId || directItem.id)) {
                    cartItems = [directItem];
                    isDirectBuyNow = true;
                }
            } catch(e) {}
        }

        // 2. Fetch products map for detail enrichment
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
            const festResponse = await getActiveFestivalSale();
            if (festResponse && festResponse.success && festResponse.data) {
                activeFestivalSale = festResponse.data;
            }
        } catch(e) {
            console.error('Error fetching marketing sale in checkout', e);
        }

        // 3. If not Direct Buy Now, load full cart from backend
        if (!isDirectBuyNow) {
            try {
                const response = await apiFetch(`https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/api/v1/cart`);
                
                if (response.status === 401 || response.status === 403) {
                    window.location.href = "index.html";
                    return;
                }
                const data = await response.json();
                
                if (response.ok && data.success) {
                    cartItems = data.data?.items || data.items || data.data || [];
                } else {
                    cartItems = [];
                }
            } catch (error) {
                console.error("Error loading cart for checkout:", error);
                cartItems = [];
            }
        }

        // 4. Enrich cart items with product details and prices if missing
        cartItems.forEach(item => {
            const pId = item.productId || item.id || item.cartItemId;
            const itemTitle = item.productName || item.title || '';
            const matchedProd = (pId && allProductsMap.get(String(pId))) || (itemTitle && allProductsMap.get(itemTitle.toLowerCase().trim())) || {};
            
            item.productName = item.productName || item.title || matchedProd.name || matchedProd.title || 'Product';
            item.price = Number(item.price || item.unitPrice || item.sellingPrice || matchedProd.sellingPrice || matchedProd.price || matchedProd.mrp || 0);
            item.imageUrl = item.imageUrl || item.image || matchedProd.imageUrl || matchedProd.image || (matchedProd.images && matchedProd.images[0]) || '';
        });

        renderSummary();
    }
    function renderSummary() {
        if (!summaryList) return;
        
        summaryList.innerHTML = '';
        
        if (cartItems.length === 0) {
            summaryList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Your cart is empty.</p>';
            if (btnPurchase) btnPurchase.disabled = true;
        }
        let subtotal = 0;
        let totalQuantity = 0;
        cartItems.forEach(item => {
            const pId = item.productId || item.id || item.cartItemId;
            const itemTitle = item.productName || item.title || '';
            const matchedProd = (pId && allProductsMap.get(String(pId))) || (itemTitle && allProductsMap.get(itemTitle.toLowerCase().trim())) || {};
            
            const title = itemTitle || matchedProd.name || matchedProd.title || 'Product';
            let originalPrice = Number(item.price || item.unitPrice || matchedProd.sellingPrice || matchedProd.price || matchedProd.mrp || 0);
            let price = originalPrice;
            const quantity = Number(item.quantity) || 1;
            
            let rawImg = item.imageUrl || item.image || matchedProd.imageUrl || matchedProd.image;
            if (!rawImg && matchedProd.images && matchedProd.images.length > 0) {
                const firstImg = matchedProd.images[0];
                rawImg = typeof firstImg === 'string' ? firstImg : (firstImg.imageUrl || firstImg.url || firstImg.image);
            }
            
            const imageUrl = sanitizeUrl(rawImg);
            const fallbackImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
            
            if (activeFestivalSale && !item.isFestivalDiscounted) {
                if (activeFestivalSale.discountType === 'percentage' || activeFestivalSale.discountType === 'PERCENTAGE') {
                    price = price * (1 - (activeFestivalSale.discountValue / 100));
                } else {
                    price = Math.max(0, price - activeFestivalSale.discountValue);
                }
            }
            subtotal += (price * quantity);
            totalQuantity += quantity;
            const itemEl = document.createElement('div');
            itemEl.className = 'summary-mini-item';
            
            let priceHtml = `<div class="mini-price">${formatCurrency(price * quantity)}</div>`;
            if (activeFestivalSale && price < originalPrice) {
                priceHtml = `
                    <div class="mini-price">
                        <div style="font-size: 0.8em; color: #888; text-decoration: line-through;">${formatCurrency(originalPrice * quantity)}</div>
                        <div>${formatCurrency(price * quantity)}</div>
                        <div style="font-size: 0.7em; color: #ef4444; font-weight: bold; margin-top: 2px;">(Festival Sale)</div>
                    </div>
                `;
            }
            itemEl.innerHTML = `
                <div class="mini-img"><img src="${imageUrl}" alt="${title}" onerror="this.onerror=null; this.src='${fallbackImg}';"></div>
                <div class="mini-details">
                    <p class="mini-title">${title}</p>
                    <p class="mini-qty">Qty: ${quantity}</p>
                </div>
                ${priceHtml}
            `;
            summaryList.appendChild(itemEl);
        });
        const shipping = totalQuantity * 30;
        checkoutTotal = subtotal + shipping;
        if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
        const shippingEl = document.getElementById('checkout-shipping');
        if (shippingEl) shippingEl.textContent = formatCurrency(shipping);
        if (totalEl) totalEl.textContent = formatCurrency(checkoutTotal);
    }
    // Handle Place Order
    if (btnPurchase) {
        btnPurchase.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (cartItems.length === 0) {
                if(window.showCustomAlert) window.showCustomAlert("Your cart is empty!");
                else alert("Your cart is empty!");
                return;
            }
            // Gather address data
            const fullName = document.getElementById('billing-fullname')?.value.trim();
            const street = document.getElementById('billing-street')?.value.trim();
            const city = document.getElementById('billing-city')?.value.trim();
            const state = document.getElementById('billing-state')?.value.trim();
            const zip = document.getElementById('billing-zip')?.value.trim();
            const country = document.getElementById('billing-country')?.value.trim();
            if (!fullName || !street || !city || !state || !zip || !country) {
                if(window.showCustomAlert) window.showCustomAlert("Please fill in all shipping address fields.");
                else alert("Please fill in all shipping address fields.");
                return;
            }
            // The backend placeOrder expects shippingAddress
            // Some fields are derived like firstName, lastName, etc if needed, but we'll map what we have
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            let userEmail = "";
            try {
                const idToken = localStorage.getItem('idToken');
                if (idToken) {
                    const payload = JSON.parse(atob(idToken.split('.')[1]));
                    if (payload.email) userEmail = payload.email;
                }
            } catch (e) {
                console.error("Could not parse email from token", e);
            }
            const shippingAddress = {
                firstName: firstName,
                lastName: lastName,
                email: userEmail || "No Email",
                phone: "000-000-0000",
                address: street,
                city: city,
                state: state,
                zipCode: zip,
                country: country
            };
            const originalBtnText = btnPurchase.innerHTML;
            btnPurchase.disabled = true;
            btnPurchase.innerHTML = 'Processing...';
            try {
                const response = await apiFetch(`${API.orderService}/api/v1/order`, {
                    method: 'POST',
                    body: JSON.stringify({ shippingAddress, calculatedTotal: checkoutTotal, items: cartItems })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    const orderId = data.data?.orderId || data.data?.id || '';
                    const orderTotal = data.data?.calculatedTotal || data.data?.orderTotal || 0;
                    
                    // Check selected payment method
                    const selectedPaymentRadio = document.querySelector('input[name="payment_method"]:checked');
                    const paymentMethod = selectedPaymentRadio ? selectedPaymentRadio.value : 'cod';

                    // Cash On Delivery (COD) Flow
                    if (paymentMethod === 'cod') {
                        sessionStorage.removeItem('direct_buy_now_item');
                        window.location.href = `payment-success.html?orderId=${orderId}&paymentMethod=COD`;
                        return;
                    }

                    // Online Payment Flow (Razorpay)
                    const amountInPaise = Math.round(orderTotal * 100);
                    const razorpayResponse = await apiFetch(`${API.paymentService}/api/v1/payment/razorpay/create-order`, {
                        method: 'POST',
                        body: JSON.stringify({ amount: amountInPaise, receipt: orderId })
                    });
                    
                    const razorpayData = await razorpayResponse.json();
                    
                    if (razorpayResponse.ok && razorpayData.success) {
                        const rzpOptions = {
                            key: "rzp_test_TEuRJimbaRgE8y", // Replace with env variable in build if possible, but safe for frontend test
                            amount: razorpayData.data.amount,
                            currency: razorpayData.data.currency,
                            name: "CloudBasket",
                            description: "Order Payment",
                            order_id: razorpayData.data.id,
                            handler: async function (response) {
                                try {
                                    // Verify Payment Signature
                                    const verifyRes = await apiFetch(`${API.paymentService}/api/v1/payment/razorpay/verify-payment`, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            razorpay_order_id: response.razorpay_order_id,
                                            razorpay_payment_id: response.razorpay_payment_id,
                                            razorpay_signature: response.razorpay_signature,
                                            orderId: orderId,
                                            amount: orderTotal
                                        })
                                    });
                                    
                                    const verifyData = await verifyRes.json();
                                    
                                    if (verifyRes.ok && verifyData.success) {
                                        window.location.href = `payment-success.html?orderId=${orderId}`;
                                    } else {
                                        alert("Payment verification failed.");
                                        btnPurchase.disabled = false;
                                        btnPurchase.innerHTML = originalBtnText;
                                    }
                                } catch (err) {
                                    console.error("Verification Error:", err);
                                    alert("Error verifying payment.");
                                    btnPurchase.disabled = false;
                                    btnPurchase.innerHTML = originalBtnText;
                                }
                            },
                            prefill: {
                                name: fullName,
                                email: shippingAddress.email,
                                contact: shippingAddress.phone
                            },
                            theme: {
                                color: "#2563eb"
                            },
                            modal: {
                                ondismiss: function() {
                                    btnPurchase.disabled = false;
                                    btnPurchase.innerHTML = originalBtnText;
                                }
                            }
                        };
                        const rzp = new window.Razorpay(rzpOptions);
                        rzp.on('payment.failed', function (response){
                            alert(response.error.description);
                            btnPurchase.disabled = false;
                            btnPurchase.innerHTML = originalBtnText;
                        });
                        rzp.open();
                    } else {
                        throw new Error(razorpayData.message || 'Failed to initialize payment gateway');
                    }
                } else {
                    throw new Error(data.message || 'Failed to place order');
                }
            } catch (error) {
                console.error("Checkout Error:", error);
                if(window.showCustomAlert) window.showCustomAlert(error.message);
                else alert(error.message);
                btnPurchase.disabled = false;
                btnPurchase.innerHTML = originalBtnText;
            }
        });
    }
    function updateDeliveryDate() {
        const deliveryDateEl = document.getElementById('delivery-date-text');
        if (!deliveryDateEl) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dayName = tomorrow.toLocaleDateString("en-US", { weekday: 'long' });
        const monthName = tomorrow.toLocaleDateString("en-US", { month: 'short' });
        const dateNum = tomorrow.getDate();

        let suffix = 'th';
        if (dateNum % 10 === 1 && dateNum !== 11) suffix = 'st';
        else if (dateNum % 10 === 2 && dateNum !== 12) suffix = 'nd';
        else if (dateNum % 10 === 3 && dateNum !== 13) suffix = 'rd';

        deliveryDateEl.textContent = `Arriving by ${dayName}, ${monthName} ${dateNum}${suffix}`;
    }

    // Initialize
    updateDeliveryDate();
    loadCheckoutCart();
});