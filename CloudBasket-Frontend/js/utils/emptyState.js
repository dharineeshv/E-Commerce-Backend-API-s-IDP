export function showEmptyState(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 60px 20px;">
                <div style="margin-bottom: 16px;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
                        <path d="M21 16V8"></path>
                        <path d="M3 8v8"></path>
                        <path d="M1 6l11 6 11-6"></path>
                        <path d="M12 22V12"></path>
                    </svg>
                </div>
                <h3 style="color: #374151; margin-bottom: 8px; font-size: 18px; font-weight: 600;">No products found</h3>
                <p style="color: #6b7280; margin-bottom: 24px;">You haven't added any products to your store yet.</p>
                <a href="add-product.html" class="btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add First Product
                </a>
            </td>
        </tr>
    `;
}

export function showErrorState(containerId, retryCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 60px 20px;">
                <div style="margin-bottom: 16px; color: #ef4444;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3 style="color: #374151; margin-bottom: 8px; font-size: 18px; font-weight: 600;">Failed to load products</h3>
                <p style="color: #6b7280; margin-bottom: 24px;">There was an error connecting to the server.</p>
                <button id="retryApiBtn" class="btn-outline" style="display: inline-flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    Retry
                </button>
            </td>
        </tr>
    `;
    document.getElementById('retryApiBtn').addEventListener('click', retryCallback);
}
