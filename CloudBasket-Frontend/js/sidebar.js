// ==========================================================
// Sidebar Toggle
// ==========================================================

export function initializeSidebar() {

    const menuToggle =
        document.getElementById("menu-toggle");

    const sidebar =
        document.querySelector(".dashboard-sidebar");

    const main =
        document.querySelector(".dashboard-main");

    menuToggle.addEventListener("click", () => {

        sidebar.classList.toggle("collapsed");

        main.classList.toggle("expanded");

    });

}