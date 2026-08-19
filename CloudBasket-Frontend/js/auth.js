// ==========================================
// Authentication APIs
// ==========================================

async function register(userData) {

    return await apiRequest(
        "/api/v1/auth/register",
        "POST",
        userData
    );

}

async function login(userData) {

    return await apiRequest(
        "/api/v1/auth/login",
        "POST",
        userData
    );

}

async function verifyEmail(userData) {

    return await apiRequest(
        "/api/v1/auth/verify",
        "POST",
        userData
    );

}
