// Inject the Chatbot widget into the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatbotHTML = `
        <div id="global-chatbot-widget">
            <div class="chatbot-tooltip">
                Hi! Need help?
            </div>
            <div class="chatbot-button" onclick="toggleChatbot()">
                <!-- SVG Robot Icon with blinking eye class added -->
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                    <circle cx="12" cy="5" r="2"></circle>
                    <path d="M12 7v4"></path>
                    <line x1="8" y1="16" x2="8.01" y2="16" class="chatbot-eye"></line>
                    <line x1="16" y1="16" x2="16.01" y2="16" class="chatbot-eye"></line>
                </svg>
            </div>
        </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
});

// Global function for the chatbot button click
window.toggleChatbot = function() {
    if (window.showCustomAlert) {
        window.showCustomAlert("Chatbot feature coming soon!");
    } else {
        alert("Chatbot feature coming soon!");
    }
};
