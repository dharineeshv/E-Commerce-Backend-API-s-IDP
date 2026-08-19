// ==========================================================
// Toast Notification
// ==========================================================

export function showToast(message, type = "info") {

    let container = document.getElementById("toast-container");

    if (!container) {

        container = document.createElement("div");

        container.id = "toast-container";

        container.style.cssText = `
            position:fixed;
            top:20px;
            right:20px;
            z-index:99999;
            display:flex;
            flex-direction:column;
            gap:12px;
        `;

        document.body.appendChild(container);

    }

    const toast = document.createElement("div");

    let borderColor = "#2563EB";
    let icon = "ℹ";

    if (type === "success") {

        borderColor = "#16A34A";
        icon = "✓";

    }

    if (type === "error") {

        borderColor = "#DC2626";
        icon = "✕";

    }

    toast.style.cssText = `
        min-width:320px;
        background:#fff;
        border-left:5px solid ${borderColor};
        border-radius:12px;
        padding:16px;
        box-shadow:0 10px 30px rgba(0,0,0,.12);
        display:flex;
        align-items:center;
        gap:12px;
        transform:translateX(120%);
        transition:.35s;
        font-family:Poppins,sans-serif;
    `;

    toast.innerHTML = `
        <span style="font-size:20px;color:${borderColor}">
            ${icon}
        </span>

        <span>
            ${message}
        </span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {

        toast.style.transform = "translateX(0)";

    });

    setTimeout(() => {

        toast.style.transform = "translateX(120%)";

        setTimeout(() => {

            toast.remove();

        }, 350);

    }, 3000);

}
