import { apiFetch } from "./apiClient.js";
import { API } from "../config.js";

export async function getProfile(customerId) {
    try {
        const response = await apiFetch(
            `${API.userProfileService}/api/v1/profile/${customerId}`
        );
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

export async function getMyProfile() {

    const response = await apiFetch(
        `${API.userProfileService}/api/v1/profile/me`
    );

    return await response.json();

}
