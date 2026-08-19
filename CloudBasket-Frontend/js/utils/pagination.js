export function renderPaginationControls(totalItems, currentPage, itemsPerPage, onPageChange) {
    const wrapper = document.querySelector('.pagination-wrapper');
    if (!wrapper) return;
    
    if (totalItems === 0) {
        wrapper.style.display = 'none';
        return;
    }
    
    wrapper.style.display = 'flex';
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Update rows per page text
    const rowsText = wrapper.querySelector('.rows-per-page span:last-child');
    if (rowsText) {
        rowsText.textContent = `of ${totalItems} products`;
    }
    
    const controls = wrapper.querySelector('.pagination-controls');
    if (!controls) return;
    
    let html = '';
    
    // Prev button
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    html += `<button class="page-btn" data-page="${currentPage - 1}" ${prevDisabled}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        // Simple logic: show first, last, and +/- 1 from current
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const activeClass = i === currentPage ? 'active' : '';
            html += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }
    
    // Next button
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    html += `<button class="page-btn" data-page="${currentPage + 1}" ${nextDisabled}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>`;
    
    controls.innerHTML = html;
    
    // Attach events
    const btns = controls.querySelectorAll('.page-btn:not([disabled])');
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newPage = parseInt(e.currentTarget.getAttribute('data-page'));
            if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
                onPageChange(newPage);
            }
        });
    });
}
