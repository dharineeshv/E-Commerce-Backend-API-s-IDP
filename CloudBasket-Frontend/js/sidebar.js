// ==========================================================
// Sidebar Toggle with Mobile Off-Canvas Support
// ==========================================================

export function initializeSidebar() {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.querySelector(".dashboard-sidebar");
    const main = document.querySelector(".dashboard-main");

    // Create backdrop overlay if missing
    let overlay = document.querySelector(".sidebar-backdrop");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "sidebar-backdrop";
        document.body.appendChild(overlay);
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            if (window.innerWidth <= 900) {
                document.body.classList.toggle("sidebar-open");
            } else {
                sidebar.classList.toggle("collapsed");
                if (main) main.classList.toggle("expanded");
            }
        });
    }

    if (overlay) {
        overlay.addEventListener("click", () => {
            document.body.classList.remove("sidebar-open");
        });
    }

    // Close mobile drawer when clicking navigation items
    document.querySelectorAll(".sidebar-item:not(.group-toggle)").forEach(item => {
        item.addEventListener("click", () => {
            if (window.innerWidth <= 900) {
                document.body.classList.remove("sidebar-open");
            }
        });
    });
}
