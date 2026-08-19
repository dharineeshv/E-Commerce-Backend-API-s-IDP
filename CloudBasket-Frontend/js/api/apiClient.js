// ==========================================
// Authenticated API Client
// ==========================================

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("idToken");
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };
    if (token && token !== "null" && token !== "undefined") {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    return response;
}

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

function initProfileDropdown() {
    const profileLinks = document.querySelectorAll('.nav-link');
    let profileLink = null;
    profileLinks.forEach(link => {
        if (link.textContent.trim() === 'Profile') {
            profileLink = link;
        }
    });

    if (!profileLink) return;

    const idTokenStr = localStorage.getItem("idToken");
    if (!idTokenStr) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'login.html';
        });
        return;
    }

    const decoded = parseJwt(idTokenStr);
    if (!decoded || !decoded.email) return;

    const email = decoded.email;
    const namePart = email.split('@')[0];
    const customerName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    // Create dropdown container
    const container = document.createElement('div');
    container.className = 'profile-dropdown-container';
    container.style.position = 'relative';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';

    // Move profileLink into container
    profileLink.parentNode.insertBefore(container, profileLink);
    container.appendChild(profileLink);

    // Dropdown HTML
    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    dropdown.style.display = 'none';
    dropdown.style.position = 'absolute';
    dropdown.style.right = '0';
    dropdown.style.top = '100%';
    dropdown.style.marginTop = '10px';
    dropdown.style.background = 'white';
    dropdown.style.border = '1px solid #e2e8f0';
    dropdown.style.borderRadius = '8px';
    dropdown.style.padding = '16px';
    dropdown.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    dropdown.style.minWidth = '200px';
    dropdown.style.zIndex = '1000';

    dropdown.innerHTML = `
        <div style="font-weight: 600; font-size: 15px; color: #0f172a; margin-bottom: 4px;">${customerName}</div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">${email}</div>
        <button id="logout-btn" style="width: 100%; text-align: left; background: transparent; border: none; padding: 0; color: #ef4444; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Log Out
        </button>
    `;

    container.appendChild(dropdown);

    // Toggle logic
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Logout logic
    const logoutBtn = dropdown.querySelector('#logout-btn');
    logoutBtn.addEventListener('click', () => {
        window.showCustomConfirm('Are you sure you want to log out?', () => {
            const reviewsToPreserve = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('cb_reviews_') || key.startsWith('cb_user_reviews_') || key === 'cb_global_reviews_db')) {
                    reviewsToPreserve[key] = localStorage.getItem(key);
                }
            }
            localStorage.clear();
            Object.keys(reviewsToPreserve).forEach(k => {
                localStorage.setItem(k, reviewsToPreserve[k]);
            });
            const path = window.location.pathname;
            if (path.includes('/pages/')) {
                window.location.href = "../../index.html";
            } else {
                window.location.href = "index.html";
            }
        });
    });
}

// Custom Modals
window.showCustomAlert = function(message) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'transparent';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const box = document.createElement('div');
    box.style.background = 'white';
    box.style.padding = '24px';
    box.style.borderRadius = '12px';
    box.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
    box.style.maxWidth = '400px';
    box.style.width = '90%';
    box.style.textAlign = 'center';

    const text = document.createElement('p');
    text.style.margin = '0 0 20px 0';
    text.style.color = '#0f172a';
    text.style.fontSize = '16px';
    text.style.fontWeight = '500';
    text.innerText = message;

    const btn = document.createElement('button');
    btn.innerText = 'OK';
    btn.style.background = '#0f4a8a';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.padding = '10px 24px';
    btn.style.borderRadius = '6px';
    btn.style.fontWeight = '600';
    btn.style.cursor = 'pointer';

    btn.onclick = () => {
        document.body.removeChild(overlay);
    };

    box.appendChild(text);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
};

window.showCustomConfirm = function(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'transparent';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const box = document.createElement('div');
    box.style.background = 'white';
    box.style.padding = '24px';
    box.style.borderRadius = '12px';
    box.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
    box.style.maxWidth = '400px';
    box.style.width = '90%';
    box.style.textAlign = 'center';

    const text = document.createElement('p');
    text.style.margin = '0 0 20px 0';
    text.style.color = '#0f172a';
    text.style.fontSize = '16px';
    text.style.fontWeight = '500';
    text.innerText = message;

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '12px';
    btnContainer.style.justifyContent = 'center';

    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancel';
    cancelBtn.style.background = '#e2e8f0';
    cancelBtn.style.color = '#0f172a';
    cancelBtn.style.border = 'none';
    cancelBtn.style.padding = '10px 24px';
    cancelBtn.style.borderRadius = '6px';
    cancelBtn.style.fontWeight = '600';
    cancelBtn.style.cursor = 'pointer';

    cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.innerText = 'Confirm';
    confirmBtn.style.background = '#ef4444';
    confirmBtn.style.color = 'white';
    confirmBtn.style.border = 'none';
    confirmBtn.style.padding = '10px 24px';
    confirmBtn.style.borderRadius = '6px';
    confirmBtn.style.fontWeight = '600';
    confirmBtn.style.cursor = 'pointer';

    confirmBtn.onclick = () => {
        document.body.removeChild(overlay);
        onConfirm();
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);
    
    box.appendChild(text);
    box.appendChild(btnContainer);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
};

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileDropdown);
} else {
    initProfileDropdown();
}
