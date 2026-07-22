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
    function formatCurrency(value) {
        return '\u20B9' + Number(value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    let activeFestivalSale = null;
    async function loadCheckoutCart() {
        if (!summaryList) return;
        
        summaryList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Loading your cart...</p>';
        try {
            const festResponse = await getActiveFestivalSale();
            if (festResponse && festResponse.success && festResponse.data) {
                activeFestivalSale = festResponse.data;
            }
        } catch(e) {
            console.error('Error fetching marketing sale in checkout', e);
        }
        try {
            const response = await apiFetch(`${API.orderService}/api/v1/cart`);
            
            if (response.status === 401 || response.status === 403) {
                window.location.href = "index.html";
                return;
            }
            const data = await response.json();
            
            if (response.ok && data.success) {
                cartItems = data.data?.items || data.items || data.data || [];
                renderSummary();
            } else {
                throw new Error(data.message || 'Failed to load cart');
            }
        } catch (error) {
            console.error("Error loading cart for checkout:", error);
            summaryList.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 20px;">Failed to load cart. Please refresh.</p>';
            cartItems = [];
        }
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
            const title = item.productName || item.title || 'Product';
            let originalPrice = item.price || 0;
            let price = originalPrice;
            const quantity = item.quantity || 1;
            const imageUrl = item.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=80&q=80';
            
            if (activeFestivalSale) {
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
                <div class="mini-img"><img src="${imageUrl}" alt="${title}"></div>
                <div class="mini-details">
                    <p class="mini-title">${title}</p>
                    <p class="mini-qty">Qty: ${quantity}</p>
                </div>
                ${priceHtml}
            `;
            summaryList.appendChild(itemEl);
        });
        const shipping = totalQuantity * 30;
        const total = subtotal + shipping;
        if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
        const shippingEl = document.getElementById('checkout-shipping');
        if (shippingEl) shippingEl.textContent = formatCurrency(shipping);
        if (totalEl) totalEl.textContent = formatCurrency(total);
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
                    body: JSON.stringify({ shippingAddress, calculatedTotal: total })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    const orderId = data.data?.orderId || data.data?.id || '';
                    const orderTotal = data.data?.calculatedTotal || data.data?.orderTotal || 0;
                    
                    // Create Razorpay Order
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
    // Initialize
    loadCheckoutCart();
});