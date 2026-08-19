// ==========================================
// CloudBasket API Configuration
// ==========================================

const API_BASE_URL = "https://rua1bnesw8.execute-api.ap-southeast-1.amazonaws.com/api";

// Cognito OAuth Configuration
const COGNITO_DOMAIN = "https://cloudbasket-dharineesh-personal.auth.ap-southeast-1.amazoncognito.com";
const COGNITO_CLIENT_ID = "1k7mhcnrgulj3hidoklf431g0h";
const getRedirectUri = () => window.location.origin + window.location.pathname;

// Clean raw stack trace text from error messages
function cleanErrorMessage(msg, defaultMsg = "Request failed. Please try again.") {
    if (!msg || typeof msg !== 'string') return defaultMsg;
    let clean = msg.split(/\r?\n|\s+at\s+/)[0].trim();
    clean = clean.replace(/^Error:\s*/i, '');
    clean = clean.replace(/username/gi, 'email');
    if (!clean || clean.length > 80 || clean.includes("file:///") || clean.includes("processTicks")) {
        return defaultMsg;
    }
    return clean;
}

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

    try {
        const response = await fetch(API_BASE_URL + endpoint, options);

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text };
        }

        if (!response.ok) {
            const rawMsg = data?.message || data?.error || data?.errorMessage || "Request failed.";
            throw new Error(cleanErrorMessage(rawMsg, "Request failed."));
        }

        return data;
    } catch (err) {
        if (err instanceof SyntaxError || (err.message && (err.message.includes("JSON") || err.message.includes("Unexpected token")))) {
            throw new Error("Invalid server response.");
        }
        err.message = cleanErrorMessage(err.message, err.message || "Request failed.");
        throw err;
    }
}
