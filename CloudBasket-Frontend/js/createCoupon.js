import { initializeLogout } from "./logout.js";
import { API } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    initializeLogout();

    const generateBtn = document.getElementById('generate-code-btn');
    const couponInput = document.getElementById('coupon-code');
    const summaryCode = document.getElementById('summary-code');
    
    const typeSelect = document.getElementById('discount-type');
    const valueInput = document.getElementById('discount-value');
    const summaryOff = document.getElementById('summary-off');
    const summaryType = document.getElementById('summary-type');
    const summaryValue = document.getElementById('summary-value');

    // Generate random coupon code
    if (generateBtn && couponInput) {
        generateBtn.addEventListener('click', () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = '';
            for (let i = 0; i < 10; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            couponInput.value = code;
            summaryCode.textContent = code;
        });
    }

    if (couponInput) {
        couponInput.addEventListener('input', (e) => {
            summaryCode.textContent = e.target.value || '---';
        });
    }

    function updateSummary() {
        const val = valueInput.value || '0';
        const type = typeSelect.value;

        summaryType.textContent = type;
        if (type === 'Percentage (%)') {
            summaryValue.textContent = val + '%';
            summaryOff.innerHTML = `<strong>${val}% off</strong> all eligible items.`;
        } else {
            summaryValue.textContent = '₹' + val;
            summaryOff.innerHTML = `<strong>₹${val} off</strong> all eligible items.`;
        }
    }

    if (typeSelect) typeSelect.addEventListener('change', updateSummary);
    if (valueInput) valueInput.addEventListener('input', updateSummary);

    // Create Coupon
    const createBtn = document.getElementById("create-coupon-btn");
    if (createBtn) {
        createBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            
            const code = couponInput.value.trim();
            const type = typeSelect.value === 'Percentage (%)' ? 'PERCENTAGE' : 'FIXED';
            const value = parseFloat(valueInput.value) || 0;
            const minOrder = parseFloat(document.getElementById("min-order-value").value) || 0;
            const usageLimit = parseInt(document.getElementById("usage-limit").value) || 0;
            const expiryDateRaw = document.getElementById("expiry-date").value;
            
            if (!code || !expiryDateRaw) {
                alert("Please provide at least a Coupon Code and Expiry Date.");
                return;
            }

            const parseDate = (str) => {
                const parts = str.split('-');
                if (parts.length >= 3 && parts[0].length <= 2) {
                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
                }
                return new Date(str).toISOString(); // fallback
            };
            
            let validUntil;
            try {
                validUntil = parseDate(expiryDateRaw);
            } catch (e) {
                alert("Invalid date format.");
                return;
            }

            const maximumDiscount = parseFloat(document.getElementById("maximum-discount").value) || 0;

            const payload = {
                couponCode: code,
                discountType: type,
                discountValue: value,
                minimumOrderAmount: minOrder,
                maximumDiscount: maximumDiscount,
                expiryDate: validUntil,
                startDate: new Date().toISOString(), // Valid from now
                usageLimit: usageLimit === 0 ? null : usageLimit, // 0 or empty means unlimited
                status: "ACTIVE",
                title: code + " Offer",
                description: "Discount coupon " + code
            };

            createBtn.textContent = "Creating...";
            createBtn.disabled = true;

            try {
                const response = await fetch(`${API.marketingService}/api/v1/marketing/coupons`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    window.location.href = "marketing.html";
                } else {
                    const data = await response.json();
                    alert("Failed to create coupon: " + (data.message || 'Unknown error'));
                    createBtn.textContent = "Create Coupon";
                    createBtn.disabled = false;
                }
            } catch (error) {
                console.error("Error creating coupon:", error);
                alert("An error occurred. Please try again.");
                createBtn.textContent = "Create Coupon";
                createBtn.disabled = false;
            }
        });
    }
});
