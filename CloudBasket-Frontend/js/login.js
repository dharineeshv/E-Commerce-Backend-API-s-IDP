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