import { apiFetch } from "./apiClient.js";
import { API } from "../config.js";

export async function getProfile(customerId) {

    const response = await apiFetch(
        `${API.userProfileService}/api/v1/profile/${customerId}`
    );

    return await response.json();

}

export async function getMyProfile() {

    const response = await apiFetch(
        `${API.userProfileService}/api/v1/profile/me`
    );

    return await response.json();

}