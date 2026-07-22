// ==========================================
// CloudBasket Login
// ==========================================

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

const loginForm = document.getElementById("loginForm");

const loginButton = document.getElementById("loginBtn");

const passwordInput = document.getElementById("password");

const togglePassword = document.getElementById("togglePassword");

// ==========================================
// Password Toggle
// ==========================================

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.classList.remove("fa-eye");

        togglePassword.classList.add("fa-eye-slash");

    } else {

        passwordInput.type = "password";

        togglePassword.classList.remove("fa-eye-slash");

        togglePassword.classList.add("fa-eye");

    }

});

// ==========================================
// Login
// ==========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();

    const password = passwordInput.value.trim();

    if (!email) {

        showToast(
            "warning",
            "Email Required",
            "Please enter your email address."
        );

        return;

    }

    if (!password) {

        showToast(
            "warning",
            "Password Required",
            "Please enter your password."
        );

        return;

    }

    loginButton.disabled = true;

    loginButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Logging in...
    `;

    try {

        const response = await apiRequest(

            "/api/v1/auth/login",

            "POST",

            {
                email,
                password
            }

        );

        /*
            IMPORTANT

            Check your authentication-service response.

            Replace the property names below if your backend
            returns different names.
        */

       

       localStorage.setItem(
    "accessToken",
    response.data.accessToken
);

localStorage.setItem(
    "idToken",
    response.data.idToken
);

localStorage.setItem(
    "refreshToken",
    response.data.refreshToken
);

localStorage.setItem(
    "tokenType",
    response.data.tokenType
);

localStorage.setItem(
    "expiresIn",
    response.data.expiresIn
);

        

showToast(
    "success",
    "Login Successful",
    response.message
);

        const decodedToken = parseJwt(response.data.accessToken);
        const groups = (decodedToken && decodedToken['cognito:groups']) ? decodedToken['cognito:groups'] : [];
        
        let redirectUrl = "login.html"; // Default Customer route
        if (groups.includes('Admin')) {
            redirectUrl = "pages/dashboard/dashboard.html"; // Admin route
        }

        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 2500);

    }

    catch(error){

        console.error(error);

        showToast(

            "error",

            "Login Failed",

            error.message || "Invalid email or password."

        );

    }

    finally{

        loginButton.disabled = false;

        loginButton.innerHTML = "Login";

    }

});

// ==========================================
// Google OAuth Integration
// ==========================================

const googleLoginBtn = document.getElementById("googleLoginBtn");

if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => {
        const redirectUri = getRedirectUri();
        // CHANGED to response_type=token for Implicit Grant
        const authUrl = `${COGNITO_DOMAIN}/oauth2/authorize?identity_provider=Google&response_type=token&client_id=${COGNITO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid+email+profile`;
        
        googleLoginBtn.disabled = true;
        googleLoginBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Redirecting...
        `;
        
        window.location.href = authUrl;
    });
}

// Handle OAuth Callback on Page Load (Implicit Grant uses URL Hash instead of Search params)
window.addEventListener("DOMContentLoaded", async () => {
    // Implicit grant returns tokens in the URL hash, e.g. #access_token=123&id_token=456
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const idToken = hashParams.get("id_token");
    const errorParam = hashParams.get("error") || new URLSearchParams(window.location.search).get("error_description");
    
    if (accessToken && idToken) {
        // Clean URL immediately to hide tokens from browser history
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        if (googleLoginBtn) {
            googleLoginBtn.disabled = true;
            googleLoginBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Authenticating...
            `;
        }
        
        try {
            // Implicit grant bypasses the /oauth2/token exchange completely!
            // We can directly save the tokens from the URL hash.
            
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("idToken", idToken);
            localStorage.setItem("tokenType", hashParams.get("token_type") || "Bearer");
            localStorage.setItem("expiresIn", hashParams.get("expires_in") || "3600");
            // Implicit grant does not provide a refresh token for security reasons
            
            showToast("success", "Login Successful", "Successfully logged in with Google!");
            
            const decodedToken = parseJwt(accessToken) || {};
            const groups = decodedToken['cognito:groups'] || [];
            
            let redirectUrl = "index.html";
            if (groups.includes('Admin')) {
                redirectUrl = "pages/dashboard/dashboard.html";
            }
            
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 2500);
            
        } catch (error) {
            console.error("Google OAuth Error:", error);
            showToast("error", "Google Login Failed", error.message || "An error occurred during authentication.");
            
            if (googleLoginBtn) {
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = `
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg" alt="Google Logo" class="google-icon">
                    Continue with Google
                `;
            }
        }
    } else if (errorParam) {
        // Handle OAuth errors from Cognito (e.g. user cancelled)
        showToast("error", "Google Login Failed", errorParam);
        
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
});