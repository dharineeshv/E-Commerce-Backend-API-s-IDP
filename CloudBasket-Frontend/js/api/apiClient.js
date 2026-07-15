// ==========================================
// Authenticated API Client
// ==========================================

export async function apiFetch(url, options = {}) {

    const token = localStorage.getItem("accessToken");

    const response = await fetch(url, {

        ...options,

        headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

            ...options.headers

        }

    });

    return response;

}