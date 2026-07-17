export function showLoadingSkeleton(tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    let skeletonHTML = '';
    for(let i=0; i<5; i++) {
        skeletonHTML += `
            <tr>
                <td colspan="7">
                    <div style="height: 40px; background: #f3f4f6; border-radius: 4px; margin: 8px 0; animation: pulse 1.5s infinite;"></div>
                </td>
            </tr>
        `;
    }
    tbody.innerHTML = skeletonHTML;
}

export function hideLoadingSkeleton(tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    if (tbody) tbody.innerHTML = '';
}
