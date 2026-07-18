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
        
        let redirectUrl = "index.html"; // Default Customer route
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
        const authUrl = `${COGNITO_DOMAIN}/oauth2/authorize?identity_provider=Google&response_type=code&client_id=${COGNITO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid+email+profile`;
        
        googleLoginBtn.disabled = true;
        googleLoginBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Redirecting...
        `;
        
        window.location.href = authUrl;
    });
}

// Handle OAuth Callback on Page Load
window.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    
    if (code) {
        // Clean URL immediately
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
            const redirectUri = getRedirectUri();
            const tokenUrl = `${COGNITO_DOMAIN}/oauth2/token`;
            
            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('client_id', COGNITO_CLIENT_ID);
            params.append('code', code);
            params.append('redirect_uri', redirectUri);

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error_description || data.error || "Token exchange failed");
            }
            
            // Store tokens identically to email/password flow
            localStorage.setItem("accessToken", data.access_token);
            localStorage.setItem("idToken", data.id_token);
            if (data.refresh_token) {
                localStorage.setItem("refreshToken", data.refresh_token);
            }
            localStorage.setItem("tokenType", data.token_type);
            localStorage.setItem("expiresIn", data.expires_in);
            
            showToast("success", "Login Successful", "Successfully logged in with Google!");
            
            const decodedToken = parseJwt(data.access_token) || {};
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
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google Logo" class="google-icon">
                    Continue with Google
                `;
            }
        }
    } else if (urlParams.get("error_description")) {
        // Handle OAuth errors from Cognito (e.g. user cancelled)
        const errorDesc = urlParams.get("error_description");
        showToast("error", "Google Login Cancelled", errorDesc);
        
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
});