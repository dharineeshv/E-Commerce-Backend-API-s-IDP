// ===============================================
// Profile Card
// ===============================================

import { getMyProfile } from "./api/userProfileApi.js";

export async function initializeProfileCard() {

    const profileSection =
        document.querySelector(".profile-section");

    const profileCard =
        document.getElementById("profile-card");

    profileSection.addEventListener("click", (event) => {

        event.stopPropagation();

        profileCard.classList.toggle("show");

    });

    document.addEventListener("click", () => {

        profileCard.classList.remove("show");

    });

    try {

        const response = await getMyProfile();

        if (!response.success) {

            return;

        }

        const profile = response.data;

        document.getElementById("profile-full-name").textContent =
            profile.fullName || "Unknown User";

        document.getElementById("profile-email").textContent =
            profile.email || "N/A";

        document.getElementById("profile-phone").textContent =
            profile.phoneNumber || "N/A";

        document.getElementById("profile-username").textContent =
            profile.customerId || "N/A";

        const avatar =
            document.getElementById("profile-avatar");

        if (avatar && profile.fullName) {

            const initials = profile.fullName
                .split(" ")
                .map(word => word[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

            avatar.textContent = initials;

        }

    }

    catch (error) {

        console.error(
            "Failed to load profile:",
            error
        );

    }

}