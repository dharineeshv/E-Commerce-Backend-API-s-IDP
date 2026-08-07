import { initializeLogout } from "./logout.js";
import { API } from "./config.js";
import { uploadProductImage } from "./imageUpload.js";

document.addEventListener("DOMContentLoaded", () => {
    initializeLogout();

    // DOM Elements for Live Preview
    const campaignNameInput = document.getElementById("campaign-name");
    const campaignDescInput = document.getElementById("campaign-desc");
    const discountTypeInput = document.getElementById("discount-type");
    const discountValueInput = document.getElementById("discount-value");

    const previewTitle = document.getElementById("preview-title");
    const previewDesc = document.getElementById("preview-desc");
    const previewDiscountDisplay = document.getElementById("preview-discount-display");

    // Update Live Preview Function
    const updateLivePreview = () => {
        // Update Title
        previewTitle.textContent = campaignNameInput.value.trim() || "Summer Solstice Mega Sale 2024";

        // Update Description
        previewDesc.textContent = campaignDescInput.value.trim() || "Describe the objectives and terms of this sale...";

        // Update Discount
        const type = discountTypeInput.value;
        const val = parseFloat(discountValueInput.value) || 0;
        let discountText = "";

        if (type === "percentage" || type === "PERCENTAGE") {
            discountText = `${val}% OFF`;
        } else {
            discountText = `₹${val} OFF`;
        }

        previewDiscountDisplay.innerHTML = `${discountText} <span style="color:#ef4444; font-size:0.9rem; margin-left: 10px;"><i class="icon-clock"></i> Limited Time</span>`;
    };

    // Event Listeners for Live Preview
    campaignNameInput.addEventListener("input", updateLivePreview);
    campaignDescInput.addEventListener("input", updateLivePreview);
    discountTypeInput.addEventListener("change", updateLivePreview);
    discountValueInput.addEventListener("input", updateLivePreview);

    // Image Upload Logic
    let uploadedImageUrl = "https://cloudbasket-banners.s3.ap-southeast-1.amazonaws.com/diwali-banner.webp"; // Default mock
    let selectedImageFile = null;
    
    const fileInput = document.getElementById("campaign-banner");
    const uploadBox = document.querySelector(".upload-box");
    const previewBox = document.getElementById("preview-box");

    if (uploadBox && fileInput) {
        uploadBox.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedImageFile = file;
                const reader = new FileReader();
                reader.onload = function(event) {
                    uploadedImageUrl = event.target.result; // For preview only
                    if (previewBox) {
                        previewBox.style.backgroundImage = `url(${uploadedImageUrl})`;
                    }
                    uploadBox.querySelector("p").textContent = file.name;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Publish Campaign
    const publishBtn = document.getElementById("publish-campaign-btn");
    if (publishBtn) {
        publishBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            
            const title = campaignNameInput.value.trim();
            const subtitle = campaignDescInput.value.trim();
            const type = discountTypeInput.value.toUpperCase();
            const value = parseFloat(discountValueInput.value);
            const startDateRaw = document.getElementById("start-date").value;
            const endDateRaw = document.getElementById("end-date").value;
            
            if (!title || !startDateRaw || !endDateRaw) {
                alert("Please fill in all required fields (Name, Start Date, End Date).");
                return;
            }
            
            // Convert dd-mm-yyyy to ISO string
            const parseDate = (str) => {
                const parts = str.split('-');
                if (parts.length >= 3 && parts[0].length <= 2) {
                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
                }
                return new Date(str).toISOString(); // fallback
            };
            
            let startDate, endDate;
            try {
                startDate = parseDate(startDateRaw);
                endDate = parseDate(endDateRaw);
            } catch (e) {
                alert("Invalid date format. Use dd-mm-yyyy.");
                return;
            }

            publishBtn.textContent = "Publishing...";
            publishBtn.disabled = true;

            try {
                // Upload Image to S3 if a new file was selected
                let finalImageUrl = "https://cloudbasket-banners.s3.ap-southeast-1.amazonaws.com/diwali-banner.webp";
                if (selectedImageFile) {
                    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
                    const uploadResult = await uploadProductImage(selectedImageFile, token);
                    if (uploadResult && uploadResult.imageUrl) {
                        finalImageUrl = uploadResult.imageUrl;
                    }
                }

                const payload = {
                    title,
                    subtitle,
                    discountType: type,
                    discountValue: value,
                    startDate,
                    endDate,
                    status: "ACTIVE",
                    bannerImageUrl: finalImageUrl,
                    imageUrl: finalImageUrl,
                    bannerUrl: finalImageUrl,
                    image: finalImageUrl,
                    isFeatured: true,
                    displayOrder: 1
                };

                const response = await fetch(`${API.marketingService}/api/v1/marketing/festival-sales`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    window.location.href = "marketing.html";
                } else {
                    const data = await response.json();
                    alert("Failed to publish: " + (data.message || 'Unknown error'));
                    publishBtn.textContent = "Publish Campaign";
                    publishBtn.disabled = false;
                }
            } catch (error) {
                console.error("Error publishing campaign:", error);
                alert("An error occurred. Please try again.");
                publishBtn.textContent = "Publish Campaign";
                publishBtn.disabled = false;
            }
        });
    }
});
