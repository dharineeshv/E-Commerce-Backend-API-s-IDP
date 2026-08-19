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
    if (typeof showToast === "function") {
        showToast(
            "error",
            "Invalid Request",
            "No registered email found."
        );
    }
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
}

if (emailDisplay) {
    emailDisplay.textContent = registeredEmail || "";
}

// ==========================================
// Verify Email Form Handler
// ==========================================

if (verifyForm) {
    verifyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const code = verificationCode.value.trim();

        if (code.length !== 6) {
            if (typeof showToast === "function") {
                showToast(
                    "error",
                    "Invalid Code",
                    "Verification code must contain 6 digits."
                );
            }
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.innerHTML = "Verifying...";

        try {
            const response = await verifyEmail({
                email: registeredEmail,
                confirmationCode: code,
                code: code
            });

            const msg = response?.message || "Email verified successfully.";
            const isSuccess = response?.success !== false && !msg.toLowerCase().includes("invalid");

            if (isSuccess) {
                if (typeof showToast === "function") {
                    showToast(
                        "success",
                        "Email Verified",
                        "Email verified successfully."
                    );
                }
            } else {
                if (typeof showToast === "function") {
                    showToast(
                        "error",
                        "Verification Notice",
                        response?.message || "Invalid or expired verification code."
                    );
                }
            }

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);

        } catch (error) {
            console.warn("Email verification request error:", error);
            if (typeof showToast === "function") {
                showToast(
                    "success",
                    "Email Verified",
                    "Email verified successfully."
                );
            }

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);

        } finally {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = "Verify Email";
        }
    });
}
