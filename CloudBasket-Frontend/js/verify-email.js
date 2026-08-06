// ==========================================
// Elements
// ==========================================

const verifyForm = document.getElementById("verifyForm");

const emailDisplay = document.getElementById("registeredEmail");

const verificationCode = document.getElementById("verificationCode");

const verifyBtn = document.getElementById("verifyBtn");

// ==========================================
// Get Email from URL
// ==========================================

const params = new URLSearchParams(window.location.search);

const registeredEmail = params.get("email");

if (!registeredEmail) {

    showToast(
        "error",
        "Invalid Request",
        "No registered email found."
    );

    setTimeout(() => {

        window.location.href = "register.html";

    }, 2500);

}

emailDisplay.textContent = registeredEmail;

// ==========================================
// Verify Email
// ==========================================

verifyForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const code = verificationCode.value.trim();

    if (code.length !== 6) {

        showToast(
            "error",
            "Invalid Code",
            "Verification code must contain 6 digits."
        );

        return;

    }

    verifyBtn.disabled = true;

    verifyBtn.innerHTML = "Verifying...";

    try {

        const response = await verifyEmail({

            email: registeredEmail,

            confirmationCode: code

        });

        showToast(

            "success",

            "Email Verified",

            response.message ||

            "Email verified successfully."

        );

        setTimeout(() => {

            window.location.href = "login.html";

        }, 2500);

    }

    catch (error) {

        showToast(

            "error",

            "Verification Failed",

            error.message ||

            "Invalid verification code."

        );

    }

    finally {

        verifyBtn.disabled = false;

        verifyBtn.innerHTML = "Verify Email";

    }

});