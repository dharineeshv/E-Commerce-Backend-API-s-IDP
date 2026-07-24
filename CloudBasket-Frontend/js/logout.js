// ==========================================================
// Logout Modal
// ==========================================================

export function initializeLogout() {

    const logoutButtons = document.querySelectorAll('[id="logout-button"], .logout');

    const modal = document.getElementById("logout-modal");
    const cancel = document.getElementById("cancel-logout");
    const confirm = document.getElementById("confirm-logout");

    logoutButtons.forEach(btn => {
        btn.addEventListener("click", (event) => {
            event.preventDefault(); // In case it's a link
            event.stopPropagation();
            if (modal) modal.classList.add("show");
        });
    });

    if (cancel) {
        cancel.addEventListener("click", () => {
            if (modal) modal.classList.remove("show");
        });
    }

    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.classList.remove("show");
            }
        });
    }

    if (confirm) {
        confirm.addEventListener("click", () => {
            // Preserve customer reviews across logout sessions
            const preservedItems = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith("cb_reviews_") || key.startsWith("cb_user_reviews_") || key === "cb_global_reviews_db")) {
                    preservedItems[key] = localStorage.getItem(key);
                }
            }

            localStorage.clear();
            sessionStorage.clear();

            // Restore customer reviews
            Object.keys(preservedItems).forEach(k => {
                localStorage.setItem(k, preservedItems[k]);
            });

            window.location.href = "/CloudBasket-Frontend/index.html";
        });
    }
}