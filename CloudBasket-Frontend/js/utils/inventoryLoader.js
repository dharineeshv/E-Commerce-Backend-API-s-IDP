export function showSkeletons() {
    const tableBody = document.getElementById("inventory-table-body");
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 0;">
                    <div class="skeleton-row" style="height: 60px; margin: 10px; border-radius: 8px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: loading 1.5s infinite;"></div>
                    <div class="skeleton-row" style="height: 60px; margin: 10px; border-radius: 8px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: loading 1.5s infinite;"></div>
                    <div class="skeleton-row" style="height: 60px; margin: 10px; border-radius: 8px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: loading 1.5s infinite;"></div>
                    <div class="skeleton-row" style="height: 60px; margin: 10px; border-radius: 8px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: loading 1.5s infinite;"></div>
                </td>
            </tr>
        `;
    }

    const statIds = [
        "stat-total-products",
        "stat-total-units",
        "stat-low-stock",
        "stat-out-of-stock",
        "stat-total-value",
        "stat-recently-updated"
    ];

    statIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `<div style="height: 24px; width: 60%; border-radius: 4px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: loading 1.5s infinite;"></div>`;
        }
    });

    const style = document.createElement('style');
    style.id = "skeleton-keyframes";
    style.innerHTML = `
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `;
    if (!document.getElementById("skeleton-keyframes")) {
        document.head.appendChild(style);
    }
}

export function hideSkeletons() {
    const tableBody = document.getElementById("inventory-table-body");
    if (tableBody) {
        tableBody.innerHTML = "";
    }
}
