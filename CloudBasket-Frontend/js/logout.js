// ==========================================================
// Logout Handler
// ==========================================================

export function initializeLogout() {
    // Dynamically inject logout-modal if missing from current DOM
    let modal = document.getElementById("logout-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.id = "logout-modal";
        modal.innerHTML = `
            <div class="logout-modal">
                <div class="logout-icon">
                    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </div>
                <h2>Confirm Logout</h2>
                <p>Are you sure you want to logout from CloudBasket?</p>
                <div class="logout-buttons">
                    <button id="cancel-logout">Cancel</button>
                    <button id="confirm-logout">Logout</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const logoutButtons = document.querySelectorAll('[id="logout-button"], .logout');
    const cancel = document.getElementById("cancel-logout");
    const confirm = document.getElementById("confirm-logout");

    logoutButtons.forEach(btn => {
        btn.addEventListener("click", (event) => {
            event.preventDefault();
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
        confirm.addEventListener("click", performLogout);
    }
}

function performLogout() {
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

    // Smart redirect target calculation to index.html
    const path = window.location.pathname;
    if (path.includes('/pages/')) {
        window.location.href = "../../index.html";
    } else {
        window.location.href = "index.html";
    }
}