// ==========================================
// Authentication Guard
// ==========================================

const accessToken = localStorage.getItem("accessToken");

if (!accessToken) {

    window.location.href = "../../login.html";

}