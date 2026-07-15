// ==========================================
// CloudBasket API Configuration
// ==========================================

const API_BASE_URL = "https://5g4locecl2.execute-api.ap-southeast-1.amazonaws.com";

// ==========================================
// Common API Request
// ==========================================

async function apiRequest(endpoint, method = "GET", body = null) {

    const options = {

        method,

        headers: {
            "Content-Type": "application/json"
        }

    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(API_BASE_URL + endpoint, options);

    const data = await response.json();

    if (!response.ok) {

        throw data;

    }

    return data;

}