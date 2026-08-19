// ==============================
// Elements
// ==============================

const registerForm = document.getElementById("registerForm");

const email = document.getElementById("email");

const password = document.getElementById("password");

const confirmPassword = document.getElementById("confirmPassword");

const registerBtn = document.getElementById("registerBtn");

const passwordMatch = document.getElementById("passwordMatch");

// ==============================
// Password Rules
// ==============================

const lengthRule = document.getElementById("lengthRule");

const upperRule = document.getElementById("upperRule");

const lowerRule = document.getElementById("lowerRule");

const numberRule = document.getElementById("numberRule");

const specialRule = document.getElementById("specialRule");

// ==============================
// Password Visibility
// ==============================

document
    .getElementById("togglePassword")
    .addEventListener("click", function () {

        password.type =
            password.type === "password"
                ? "text"
                : "password";

        this.classList.toggle("fa-eye");

        this.classList.toggle("fa-eye-slash");

    });

document
    .getElementById("toggleConfirmPassword")
    .addEventListener("click", function () {

        confirmPassword.type =
            confirmPassword.type === "password"
                ? "text"
                : "password";

        this.classList.toggle("fa-eye");

        this.classList.toggle("fa-eye-slash");

    });

// ==============================
// Password Validation
// ==============================

password.addEventListener("input", validatePassword);

function validatePassword() {

    const value = password.value;

    updateRule(lengthRule, value.length >= 8);

    updateRule(upperRule, /[A-Z]/.test(value));

    updateRule(lowerRule, /[a-z]/.test(value));

    updateRule(numberRule, /\d/.test(value));

    updateRule(specialRule, /[^A-Za-z0-9]/.test(value));

    checkPasswordMatch();

}

function updateRule(element, valid) {

    element.classList.remove("valid");

    element.classList.remove("invalid");

    if (valid) {

        element.classList.add("valid");

    } else {

        element.classList.add("invalid");

    }

}

// ==============================
// Confirm Password
// ==============================

confirmPassword.addEventListener("input", checkPasswordMatch);

function checkPasswordMatch() {

    if (confirmPassword.value === "") {

        passwordMatch.innerHTML = "";

        return;

    }

    if (password.value === confirmPassword.value) {

        passwordMatch.style.color = "#22C55E";

        passwordMatch.innerHTML = "✓ Passwords match";

    } else {

        passwordMatch.style.color = "#EF4444";

        passwordMatch.innerHTML = "✗ Passwords do not match";

    }

}

// ==============================
// Register
// ==============================

registerForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (password.value !== confirmPassword.value) {

        showToast("Passwords do not match", "error");

        return;

    }

    registerBtn.disabled = true;

    registerBtn.innerHTML = "Creating Account...";

    try {

        const response = await register({

            email: email.value.trim(),

            password: password.value

        });

        showToast(
    "success",
    "Registration Successful",
    response.message
);

        setTimeout(() => {

            window.location.href =
                `verify-email.html?email=${encodeURIComponent(email.value)}`;

        }, 2500);

    } catch (error) {

        showToast(
    "error",
    "Registration Failed",
    error.message || "Something went wrong"
);

    } finally {

        registerBtn.disabled = false;

        registerBtn.innerHTML = "Create Account";

    }

});