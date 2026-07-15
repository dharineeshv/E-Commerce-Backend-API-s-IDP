// ==========================================================
// Logout Modal
// ==========================================================

export function initializeLogout() {

    const logoutButton =
        document.getElementById("logout-button");

    const modal =
        document.getElementById("logout-modal");

    const cancel =
        document.getElementById("cancel-logout");

    const confirm =
        document.getElementById("confirm-logout");

    logoutButton.addEventListener("click", (event) => {

        event.stopPropagation();

        modal.classList.add("show");

    });

    cancel.addEventListener("click", () => {

        modal.classList.remove("show");

    });

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {

            modal.classList.remove("show");

        }

    });

    confirm.addEventListener("click", () => {

        // TODO:
        // Replace these keys with the exact keys
        // your login module stores.

        localStorage.clear();

        sessionStorage.clear();

        window.location.href =
            "../../login.html";

    });

}