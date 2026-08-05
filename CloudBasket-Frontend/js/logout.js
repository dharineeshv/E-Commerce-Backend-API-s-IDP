// ==========================================================
// Logout Handler
// ==========================================================

let isLogoutInitialized = false;

export function initializeLogout() {
    // Ensure modal HTML exists in DOM
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

    if (isLogoutInitialized) return;
    isLogoutInitialized = true;

    // Robust Global Event Delegation for opening/closing/confirming logout
    document.addEventListener("click", (event) => {
        const logoutTrigger = event.target.closest('#logout-button, .logout, .logout-btn');
        const confirmBtn = event.target.closest('#confirm-logout');
        const cancelBtn = event.target.closest('#cancel-logout');
        const currentModal = document.getElementById("logout-modal");

        if (logoutTrigger) {
            event.preventDefault();
            event.stopPropagation();
            const modalTarget = currentModal || document.getElementById("logout-modal");
            if (modalTarget) {
                modalTarget.classList.add("show");
                modalTarget.classList.add("active");
                modalTarget.style.display = "flex";
                modalTarget.style.opacity = "1";
                modalTarget.style.visibility = "visible";
            }
            return;
        }

        if (confirmBtn) {
            event.preventDefault();
            event.stopPropagation();
            performLogout();
            return;
        }

        if (cancelBtn || (currentModal && event.target === currentModal)) {
            event.preventDefault();
            const modalTarget = currentModal || document.getElementById("logout-modal");
            if (modalTarget) {
                modalTarget.classList.remove("show");
                modalTarget.classList.remove("active");
                modalTarget.style.display = "none";
                modalTarget.style.opacity = "0";
                modalTarget.style.visibility = "hidden";
            }
            return;
        }
    });
}

export function performLogout() {
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