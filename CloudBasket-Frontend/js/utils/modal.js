export function openViewModal(productId) {
    const modal = document.getElementById('viewProductModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

export function closeViewModal() {
    const modal = document.getElementById('viewProductModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

export function openDeleteModal(productId) {
    const modal = document.getElementById('deleteProductModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

export function closeDeleteModal() {
    const modal = document.getElementById('deleteProductModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Bind to window for inline HTML onclick handlers
if (typeof window !== 'undefined') {
    window.openViewModal = openViewModal;
    window.closeViewModal = closeViewModal;
    window.openDeleteModal = openDeleteModal;
    window.closeDeleteModal = closeDeleteModal;
}

export function setupModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeViewModal();
                closeDeleteModal();
            }
        });
    });
    
    const closeBtns = document.querySelectorAll('.close-modal-btn, .btn-cancel');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeViewModal();
            closeDeleteModal();
        });
    });
}
