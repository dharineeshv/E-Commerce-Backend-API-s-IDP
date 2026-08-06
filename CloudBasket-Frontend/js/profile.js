// ===============================================
// Profile Card
// ===============================================

import { getMyProfile } from "./api/userProfileApi.js";

export async function initializeProfileCard() {

    const profileSection = document.querySelector(".profile-section");
    const profileCard = document.getElementById("profile-card");

    if (profileSection && profileCard) {
        profileSection.addEventListener("click", (event) => {
            // Ignore logout clicks so logout handler processes modal opening
            if (event.target.closest("#logout-button, .logout, .logout-btn")) {
                return;
            }
            event.stopPropagation();
            profileCard.classList.toggle("show");
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".profile-section, .profile-card")) {
                profileCard.classList.remove("show");
            }
        });
    }

    try {
        const response = await getMyProfile();

        if (!response || !response.success) {
            return;
        }

        const profile = response.data;

        const fullNameEl = document.getElementById("profile-full-name");
        if (fullNameEl) fullNameEl.textContent = profile.fullName || "Unknown User";

        const emailEl = document.getElementById("profile-email");
        if (emailEl) emailEl.textContent = profile.email || "N/A";

        const phoneEl = document.getElementById("profile-phone");
        if (phoneEl) phoneEl.textContent = profile.phoneNumber || "N/A";

        const usernameEl = document.getElementById("profile-username");
        if (usernameEl) usernameEl.textContent = profile.customerId || "N/A";

        const avatar = document.getElementById("profile-avatar");
        const headerAvatar = document.getElementById("header-profile-avatar");

        if (profile.fullName) {
            const initials = profile.fullName
                .split(" ")
                .map(word => word[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

            if (avatar) avatar.textContent = initials;
            if (headerAvatar) headerAvatar.textContent = initials;
        }

    } catch (error) {
        console.error("Failed to load profile:", error);
    }
}