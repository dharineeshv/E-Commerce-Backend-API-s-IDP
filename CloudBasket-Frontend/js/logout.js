// ==========================================================
// Logout Handler
// ==========================================================

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

    const showModal = () => {
        const targetModal = document.getElementById("logout-modal") || modal;
        if (targetModal) {
            targetModal.classList.add("show", "active");
            targetModal.style.setProperty("display", "flex", "important");
            targetModal.style.setProperty("opacity", "1", "important");
            targetModal.style.setProperty("visibility", "visible", "important");
            targetModal.style.setProperty("z-index", "999999", "important");
        }
    };

    const hideModal = () => {
        const targetModal = document.getElementById("logout-modal") || modal;
        if (targetModal) {
            targetModal.classList.remove("show", "active");
            targetModal.style.display = "none";
            targetModal.style.opacity = "0";
            targetModal.style.visibility = "hidden";
        }
    };

    // Attach direct click handlers to all logout elements in DOM
    const triggers = document.querySelectorAll('#logout-button, .logout, .logout-btn, [id="logout-button"]');
    triggers.forEach(trigger => {
        trigger.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showModal();
        };
    });

    // Attach direct click handler to confirm-logout button
    const confirmBtn = document.getElementById("confirm-logout");
    if (confirmBtn) {
        confirmBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            performLogout();
        };
    }

    // Attach direct click handler to cancel-logout button
    const cancelBtn = document.getElementById("cancel-logout");
    if (cancelBtn) {
        cancelBtn.onclick = (e) => {
            e.preventDefault();
            hideModal();
        };
    }

    // Document-level fallback event delegation (capture & bubble phases)
    const handleGlobalClick = (event) => {
        const logoutTarget = event.target.closest('#logout-button, .logout, .logout-btn, [id="logout-button"]');
        if (logoutTarget) {
            event.preventDefault();
            event.stopPropagation();
            showModal();
            return;
        }

        const confirmTarget = event.target.closest('#confirm-logout');
        if (confirmTarget) {
            event.preventDefault();
            event.stopPropagation();
            performLogout();
            return;
        }

        const cancelTarget = event.target.closest('#cancel-logout');
        const targetModal = document.getElementById("logout-modal") || modal;
        if (cancelTarget || (targetModal && event.target === targetModal)) {
            event.preventDefault();
            hideModal();
            return;
        }
    };

    document.addEventListener("click", handleGlobalClick, true);
    document.addEventListener("click", handleGlobalClick, false);
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
