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
                        Hi, I am Tara. How can I help you?
                    </div>
                </div>
                
                <div class="chatbot-quick-replies" id="chatbot-quick-replies">
                    <button class="quick-reply-btn" onclick="sendQuickReply('Contact Number')">Contact Number</button>
                    <button class="quick-reply-btn" onclick="sendQuickReply('Track Order')">Track Order</button>
                    <button class="quick-reply-btn" onclick="sendQuickReply('Available Coupons')">Available Coupons</button>
                    <button class="quick-reply-btn" onclick="sendQuickReply('About CloudBasket')">About CloudBasket</button>
                </div>
                
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Type your message..." onkeypress="handleChatInput(event)">
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

    // Append to body
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
});

// Global function for the chatbot button click
window.toggleChatbot = function() {
    const chatWindow = document.getElementById('chatbot-window');
    const tooltip = document.getElementById('chatbot-tooltip');
    
    if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
        chatWindow.style.display = 'flex';
        tooltip.style.display = 'none'; // Hide tooltip when open
    } else {
        chatWindow.style.display = 'none';
    }
};

window.sendQuickReply = function(text) {
    appendUserMessage(text);
    setTimeout(() => respondToMessage(text), 500);
};

window.handleChatInput = function(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
};

window.sendChatMessage = function() {
    const input = document.getElementById('chatbot-input');
    const text = input.value.trim();
    if (text) {
        appendUserMessage(text);
        input.value = '';
        setTimeout(() => respondToMessage(text), 500);
    }
};

function appendUserMessage(text) {
    const messagesBox = document.getElementById('chatbot-messages');
    messagesBox.innerHTML += `<div class="chat-msg user-msg">${text}</div>`;
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

function appendBotMessage(text) {
    const messagesBox = document.getElementById('chatbot-messages');
    messagesBox.innerHTML += `<div class="chat-msg bot-msg">${text}</div>`;
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

function respondToMessage(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('contact')) {
        appendBotMessage("You can reach our premium support at <strong>+971 50 203 20</strong> or email us at <strong>dharineeshv18@gmail.com</strong>. We're here 24/7!");
    } else if (lowerText.includes('order')) {
        appendBotMessage("To check your order status, please click the <strong>Orders</strong> link in the top navigation bar. Make sure you are logged in!");
    } else if (lowerText.includes('coupon') || lowerText.includes('discount')) {
        appendBotMessage("Yes! Use code <strong>WELCOME10</strong> at checkout for 10% off your first purchase!");
    } else if (lowerText.includes('about')) {
        appendBotMessage("CloudBasket is a premium cloud-connected marketplace. We provide highly reliable, quality products for the modern enterprise and beyond.");
    } else {
        appendBotMessage("I'm still learning! Right now I can help you with <strong>Contact Info</strong>, <strong>Order Status</strong>, <strong>Coupons</strong>, or <strong>About Us</strong>.");
    }
}
