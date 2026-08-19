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

    // 1. Instantly parse user info from JWT Token & LocalStorage
    let tokenPayload = null;
    try {
        const token = localStorage.getItem("idToken") || localStorage.getItem("accessToken");
        if (token && token.includes(".")) {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            tokenPayload = JSON.parse(jsonPayload);
        }
    } catch (e) {}

    let name = localStorage.getItem("userName");
    let email = localStorage.getItem("userEmail");
    let phone = localStorage.getItem("userPhone");
    let username = localStorage.getItem("userId") || localStorage.getItem("userSub");

    if (tokenPayload) {
        if (!name) {
            name = tokenPayload.name || 
                (tokenPayload.given_name ? `${tokenPayload.given_name} ${tokenPayload.family_name || ''}`.trim() : null) || 
                (tokenPayload.email ? tokenPayload.email.split('@')[0] : null);
        }
        if (!email) email = tokenPayload.email;
        if (!phone) phone = tokenPayload.phone_number || tokenPayload.phone;
        if (!username) username = tokenPayload["cognito:username"] || tokenPayload.username || tokenPayload.sub;
    }

    renderProfileDetails({
        fullName: name || "Dharineesh V",
        email: email || "dharineesh.v@idp.com",
        phone: phone || "+91 98765 43210",
        username: username || "dharineesh.admin"
    });

    // 2. Async fetch from User Profile Service API to update with real backend profile data
    try {
        const response = await getMyProfile();
        if (response && (response.success || response.data || response.email || response.fullName)) {
            const p = response.data || response;
            renderProfileDetails({
                fullName: p.fullName || p.name || name || "Dharineesh V",
                email: p.email || email || "dharineesh.v@idp.com",
                phone: p.phoneNumber || p.phone || phone || "+91 98765 43210",
                username: p.customerId || p.username || username || "dharineesh.admin"
            });
        }
    } catch (error) {
        console.warn("Failed to load remote profile, using token/storage:", error);
    }
}

function renderProfileDetails({ fullName, email, phone, username }) {
    const fullNameEl = document.getElementById("profile-full-name");
    if (fullNameEl) fullNameEl.textContent = fullName;

    const emailEl = document.getElementById("profile-email");
    if (emailEl) emailEl.textContent = email;

    const phoneEl = document.getElementById("profile-phone");
    if (phoneEl) phoneEl.textContent = phone;

    const usernameEl = document.getElementById("profile-username");
    if (usernameEl) usernameEl.textContent = username;

    const headerName = document.getElementById("header-user-name");
    if (headerName) headerName.textContent = fullName;

    const avatar = document.getElementById("profile-avatar");
    const headerAvatar = document.getElementById("header-profile-avatar");

    if (fullName) {
        const parts = fullName.trim().split(" ");
        const initials = parts.length > 1 
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
            : parts[0].substring(0, 2).toUpperCase();

        if (avatar) avatar.textContent = initials;
        if (headerAvatar) headerAvatar.textContent = initials;
    }
}
