// Inject the Chatbot widget into the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatbotHTML = `
        <div id="global-chatbot-widget">
            <div class="chatbot-tooltip" id="chatbot-tooltip">
                <span class="wave-emoji">👋</span> Hi, I am Tara. How can I help you?
            </div>
            
            <!-- Chatbot Window Overlay -->
            <div class="chatbot-window" id="chatbot-window" style="display: none;">
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="10" rx="4"></rect>
                                <circle cx="12" cy="5" r="2"></circle>
                                <path d="M12 7v4"></path>
                                <circle cx="8" cy="16" r="1" fill="currentColor"></circle>
                                <circle cx="16" cy="16" r="1" fill="currentColor"></circle>
                            </svg>
                        </div>
                        <div>
                            <h4>Tara - CloudBasket Assistant</h4>
                            <span class="chatbot-status">Online</span>
                        </div>
                    </div>
                    <button class="chatbot-close-btn" onclick="toggleChatbot()">×</button>
                </div>
                
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chat-msg bot-msg">
                        Hi! I am <strong>Tara</strong>, your CloudBasket AI Assistant 🤖<br>How can I help you today?
                    </div>
                </div>
                
                <div class="chatbot-quick-replies" id="chatbot-quick-replies">
                    <button class="quick-reply-btn" onclick="sendQuickReply('Hii 👋')">Hii 👋</button>
                    <button class="quick-reply-btn" onclick="sendQuickReply('My Cart 🛒')">My Cart 🛒</button>
                    <button class="quick-reply-btn" onclick="sendQuickReply('My Wishlist ❤️')">My Wishlist ❤️</button>
                    <button class="quick-reply-btn" onclick="sendQuickReply('Recent Orders 📦')">Recent Orders 📦</button>
                    <button class="quick-reply-btn" onclick="sendQuickReply('Available Coupons 🏷️')">Available Coupons 🏷️</button>
                    <button class="quick-reply-btn" onclick="sendQuickReply('Contact Support 📞')">Contact Support 📞</button>
                </div>
                
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Type cart, wishlist, orders, coupons..." onkeypress="handleChatInput(event)">
                    <button class="chatbot-send-btn" onclick="sendChatMessage()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>

            <div class="chatbot-button" id="chatbot-fab" onclick="toggleChatbot()">
                <div class="chatbot-pulse-ring"></div>
                <div class="chatbot-pulse-ring delay"></div>
                <!-- SVG Robot Icon -->
                <svg class="robot-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="4"></rect>
                    <circle cx="12" cy="5" r="2" class="antenna-bulb"></circle>
                    <path d="M12 7v4" class="antenna-stem"></path>
                    <circle cx="8" cy="16" r="1" fill="currentColor" class="chatbot-eye"></circle>
                    <circle cx="16" cy="16" r="1" fill="currentColor" class="chatbot-eye"></circle>
                    <path d="M9 19h6" class="chatbot-mouth"></path>
                </svg>
            </div>
        </div>
    `;

    // Append to body if not already present
    if (!document.getElementById('global-chatbot-widget')) {
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }
});

// Global function for the chatbot button click
window.toggleChatbot = function() {
    const chatWindow = document.getElementById('chatbot-window');
    const tooltip = document.getElementById('chatbot-tooltip');
    
    if (!chatWindow) return;

    if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
        chatWindow.style.display = 'flex';
        if (tooltip) tooltip.style.display = 'none'; // Hide tooltip when open
    } else {
        chatWindow.style.display = 'none';
    }
};

window.sendQuickReply = function(text) {
    appendUserMessage(text);
    setTimeout(() => respondToMessage(text), 400);
};

window.handleChatInput = function(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
};

window.sendChatMessage = function() {
    const input = document.getElementById('chatbot-input');
    if (!input) return;
    const text = input.value.trim();
    if (text) {
        appendUserMessage(text);
        input.value = '';
        setTimeout(() => respondToMessage(text), 400);
    }
};

function appendUserMessage(text) {
    const messagesBox = document.getElementById('chatbot-messages');
    if (!messagesBox) return;
    messagesBox.innerHTML += `<div class="chat-msg user-msg">${escapeHtml(text)}</div>`;
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

function appendBotMessage(text) {
    const messagesBox = document.getElementById('chatbot-messages');
    if (!messagesBox) return;
    messagesBox.innerHTML += `<div class="chat-msg bot-msg">${text}</div>`;
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getRecentOrdersFromStorage() {
    try {
        const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        if (localOrders && localOrders.length > 0) return localOrders;
    } catch(e) {}
    
    // Fallback sample orders
    return [
        {
            orderId: "ORD-94821",
            createdAt: new Date().toISOString(),
            status: "DELIVERED",
            totalAmount: 4999,
            itemsCount: 2
        },
        {
            orderId: "ORD-87302",
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            status: "SHIPPED",
            totalAmount: 12499,
            itemsCount: 1
        }
    ];
}

async function fetchCartData() {
    // 1. Check Local Storage
    try {
        const local = JSON.parse(localStorage.getItem('cart') || localStorage.getItem('cartItems') || '[]');
        if (Array.isArray(local) && local.length > 0) return local;
    } catch(e) {}

    // 2. Query Live Cart Service API Gateway (/api/v1/cart)
    const token = localStorage.getItem("accessToken") || localStorage.getItem("idToken");
    if (!token) return [];

    try {
        const response = await fetch("https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/v1/cart", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        if (response.ok) {
            const data = await response.json();
            const items = data.data?.items || data.items || data.data || [];
            if (Array.isArray(items)) return items;
        }
    } catch(e) {
        console.warn("Chatbot failed to fetch live cart API:", e);
    }
    return [];
}

async function fetchWishlistData() {
    // 1. Check Local Storage
    try {
        const local = JSON.parse(localStorage.getItem('wishlist') || localStorage.getItem('wishlistItems') || '[]');
        if (Array.isArray(local) && local.length > 0) return local;
    } catch(e) {}

    // 2. Query Live Wishlist Service API Gateway (/api/v1/wishlist/{customerId})
    const token = localStorage.getItem("accessToken") || localStorage.getItem("idToken");
    if (!token) return [];

    let customerId = null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        customerId = payload.sub || payload.user_id;
    } catch(e) {}

    if (!customerId) return [];

    try {
        const response = await fetch(`https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/v1/wishlist/${customerId}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        if (response.ok) {
            const data = await response.json();
            const items = data.items || data.data?.items || data.data || [];
            if (Array.isArray(items)) return items;
        }
    } catch(e) {
        console.warn("Chatbot failed to fetch live wishlist API:", e);
    }
    return [];
}

async function respondToMessage(text) {
    const lowerText = text.toLowerCase().trim();
    
    // 1. Common Greeting Interactions
    if (/^(hi|hii|hiii|hello|hey|heyy|greetings|hola|good morning|good afternoon|good evening|sup)\b/.test(lowerText)) {
        appendBotMessage("Hello! 👋 Welcome to <strong>CloudBasket</strong>! I'm Tara, your AI assistant. How can I help you today? You can check your <strong>Cart 🛒</strong>, <strong>Wishlist ❤️</strong>, <strong>Recent Orders 📦</strong>, or <strong>Coupons 🏷️</strong>!");
    } 
    // 2. How are you / Who are you
    else if (lowerText.includes('how are you') || lowerText.includes('how r u') || lowerText.includes('hows it going')) {
        appendBotMessage("I'm doing awesome, thank you for asking! 😊 Ready to help you view your cart, wishlist, or orders. What would you like to check?");
    }
    else if (lowerText.includes('who are you') || lowerText.includes('your name') || lowerText.includes('what are you')) {
        appendBotMessage("I'm <strong>Tara</strong>, your personal CloudBasket AI Assistant! 🤖 I can show your Cart details, Wishlist items, Recent orders, and find active coupons for you!");
    }
    // 3. Cart Details Display
    else if (lowerText.includes('cart')) {
        appendBotMessage("Fetching your cart items... 🛒");
        const cart = await fetchCartData();
        if (cart && cart.length > 0) {
            let totalAmount = 0;
            let itemsHtml = '';
            
            cart.slice(0, 3).forEach(item => {
                const qty = item.quantity || item.qty || 1;
                const price = item.price || item.unitPrice || item.productDetails?.price || 0;
                const itemTotal = price * qty;
                totalAmount += itemTotal;
                const title = item.title || item.name || item.productName || item.productDetails?.name || item.productDetails?.title || 'Cloud Product';
                const formattedPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(itemTotal);
                
                itemsHtml += `
                    <div style="font-size: 12px; color: #334155; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                        <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;">${escapeHtml(title)}</div>
                        <div style="display: flex; justify-content: space-between; color: #64748b; font-size: 11px; margin-top: 2px;">
                            <span>Qty: ${qty}</span>
                            <span style="font-weight: 700; color: #0f172a;">${formattedPrice}</span>
                        </div>
                    </div>
                `;
            });
            
            if (cart.length > 3) {
                itemsHtml += `<div style="font-size: 11px; color: #64748b; padding-top: 4px;">+ ${cart.length - 3} more item(s)...</div>`;
            }
            
            const formattedGrandTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount);
            
            const cartCardHtml = `
                <p>Here are your <strong>Cart Items</strong> 🛒:</p>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-top: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
                        <span style="font-weight: 700; color: #0f172a; font-size: 13px;">Shopping Cart</span>
                        <span style="background: #dbeafe; color: #2563eb; font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 700;">${cart.length} Item${cart.length > 1 ? 's' : ''}</span>
                    </div>
                    ${itemsHtml}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                        <span style="font-size: 13px; font-weight: 800; color: #1e293b;">Total: ${formattedGrandTotal}</span>
                        <a href="cart.html" style="font-size: 12px; color: #2563eb; font-weight: 700; text-decoration: none;">View Cart 🛒 →</a>
                    </div>
                </div>
            `;
            
            appendBotMessage(cartCardHtml);
        } else {
            appendBotMessage("🛒 Your shopping cart is currently empty! Explore top items in our <a href='product.html' style='color: #2563eb; font-weight: 700;'>Shop Catalog</a> to add items.");
        }
    }
    // 4. Wishlist Details Display
    else if (lowerText.includes('wishlist') || lowerText.includes('saved') || lowerText.includes('favorite') || lowerText.includes('fav')) {
        appendBotMessage("Fetching your saved wishlist items... ❤️");
        const wishlist = await fetchWishlistData();
        if (wishlist && wishlist.length > 0) {
            let wishlistItemsHtml = '';
            
            wishlist.slice(0, 4).forEach(item => {
                const title = item.title || item.name || item.productName || item.productDetails?.name || item.productDetails?.title || 'Saved Product';
                const price = item.price || item.unitPrice || item.productDetails?.price || 0;
                const formattedPrice = price ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price) : '';
                
                wishlistItemsHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #334155; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                        <span style="font-weight: 600; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(title)}</span>
                        <span style="font-weight: 700; color: #0f172a; font-size: 11px;">${formattedPrice}</span>
                    </div>
                `;
            });
            
            if (wishlist.length > 4) {
                wishlistItemsHtml += `<div style="font-size: 11px; color: #64748b; padding-top: 4px;">+ ${wishlist.length - 4} more saved item(s)...</div>`;
            }
            
            const wishlistCardHtml = `
                <p>Here are your <strong>Wishlist Items</strong> ❤️:</p>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-top: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
                        <span style="font-weight: 700; color: #0f172a; font-size: 13px;">Saved Wishlist</span>
                        <span style="background: #fce7f3; color: #db2777; font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 700;">${wishlist.length} Saved</span>
                    </div>
                    ${wishlistItemsHtml}
                    <div style="display: flex; justify-content: flex-end; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                        <a href="wishlist.html" style="font-size: 12px; color: #db2777; font-weight: 700; text-decoration: none;">Manage Wishlist ❤️ →</a>
                    </div>
                </div>
            `;
            
            appendBotMessage(wishlistCardHtml);
        } else {
            appendBotMessage("❤️ Your wishlist is currently empty! Click the heart icon on any product in the <a href='product.html' style='color: #2563eb; font-weight: 700;'>Storefront</a> to save it for later.");
        }
    }
    // 5. Recent Orders Interaction & Display
    else if (lowerText.includes('order') || lowerText.includes('track') || lowerText.includes('purchase')) {
        const orders = getRecentOrdersFromStorage();
        
        let ordersHtml = `<p>Here are your <strong>Recent Orders</strong> 📦:</p>`;
        
        orders.slice(0, 2).forEach(order => {
            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';
            const statusColor = (order.status === 'DELIVERED' || order.status === 'COMPLETED') ? '#16a34a' : '#2563eb';
            const statusBg = (order.status === 'DELIVERED' || order.status === 'COMPLETED') ? '#dcfce7' : '#dbeafe';
            const formattedTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount || 0);

            ordersHtml += `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-top: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-weight: 700; color: #0f172a; font-size: 13px;">${order.orderId}</span>
                        <span style="background: ${statusBg}; color: ${statusColor}; font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 700;">${order.status || 'PROCESSING'}</span>
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Date: ${dateStr} • ${order.itemsCount || 1} Item(s)</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                        <span style="font-size: 14px; font-weight: 800; color: #1e293b;">${formattedTotal}</span>
                        <a href="orders.html" style="font-size: 12px; color: #2563eb; font-weight: 700; text-decoration: none;">Track Order →</a>
                    </div>
                </div>
            `;
        });

        ordersHtml += `<div style="margin-top: 10px; text-align: center;"><a href="orders.html" style="font-size: 12px; color: #2563eb; font-weight: 700; text-decoration: underline;">View All Orders Page</a></div>`;

        appendBotMessage(ordersHtml);
    }
    // 6. Available Coupons & Discounts
    else if (lowerText.includes('coupon') || lowerText.includes('discount') || lowerText.includes('offer')) {
        try {
            const marketingEndpoint = (window.API && window.API.marketingService) 
                ? `${window.API.marketingService}/api/v1/marketing/coupons` 
                : 'https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api/v1/marketing/coupons';
                
            const response = await fetch(marketingEndpoint);
            const data = await response.json();
            
            let coupons = [];
            if (data && Array.isArray(data.data)) {
                coupons = data.data;
            } else if (Array.isArray(data)) {
                coupons = data;
            }
            
            // Filter active and non-expired coupons
            const activeCoupons = coupons.filter(c => {
                const isStatusActive = (!c.status || c.status === 'ACTIVE' || c.isActive === true || c.active === true);
                const isNotExpired = !c.expiryDate || new Date() <= new Date(c.expiryDate);
                return isStatusActive && isNotExpired;
            });
            
            if (activeCoupons.length > 0) {
                let couponsList = "🎉 <strong>Current Active Coupons:</strong><br><br>";
                activeCoupons.forEach(c => {
                    const code = c.couponCode || c.code || 'COUPON';
                    const isPercent = c.discountType && c.discountType.toUpperCase().includes('PERCENT');
                    const desc = c.description || (isPercent ? `${c.discountValue}% OFF` : `Flat ₹${c.discountValue} OFF`);
                    couponsList += `• <strong>${code}</strong> — ${desc}<br>`;
                });
                appendBotMessage(couponsList);
            } else {
                appendBotMessage("No coupons available at the moment.");
            }
        } catch (error) {
            console.warn("Failed to fetch coupons from marketing API:", error);
            appendBotMessage("No coupons available at the moment.");
        }
    }
    // 7. Contact Support
    else if (lowerText.includes('contact') || lowerText.includes('support') || lowerText.includes('phone') || lowerText.includes('email') || lowerText.includes('number')) {
        appendBotMessage("You can reach our CloudBasket customer support anytime:<br>📞 Mobile / Phone: <strong>+971 50 203 20</strong> (or <strong>9715020320</strong>)<br>✉️ Email: <strong>dharineeshv18@gmail.com</strong><br>🕒 Hours: 24/7 Live Assistance");
    }
    // 8. About CloudBasket
    else if (lowerText.includes('about') || lowerText.includes('cloudbasket')) {
        appendBotMessage("CloudBasket is an enterprise cloud-connected marketplace offering top-tier electronics, fashion, and home goods with guaranteed authenticity and super-fast delivery!");
    }
    // Fallback default
    else {
        appendBotMessage("I'm here to help! You can try asking about:<br>• <strong>'Cart'</strong> to check items in your cart<br>• <strong>'Wishlist'</strong> to view saved items<br>• <strong>'Recent Orders'</strong> to check your order status<br>• <strong>'Coupons'</strong> for discount codes<br>• <strong>'Contact Support'</strong> for helpline info");
    }
}
