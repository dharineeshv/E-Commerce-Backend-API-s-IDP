import { fetchProducts, deleteProductApi } from './api/productApi.js';
import { renderProducts, updateSummaryCards } from './utils/renderProducts.js';
import { showLoadingSkeleton, hideLoadingSkeleton } from './utils/loader.js';
import { showEmptyState, showErrorState } from './utils/emptyState.js';
import { renderPaginationControls } from './utils/pagination.js';
import { setupModals, openViewModal, openDeleteModal, closeDeleteModal } from './utils/modal.js';
import { initializeProfileCard } from './profile.js';
import { initializeLogout } from './logout.js';
import { initializeSidebar } from './sidebar.js';

let allProducts = [];
let currentPage = 1;
let itemsPerPage = 10;

function initManageProductsPage() {
    // Layout functionality
    initializeSidebar();
    setupLayout();
    
    // UI initializations
    setupModals();
    initializeProfileCard();
    initializeLogout();
    
    // Bind items per page dropdown
    const rowsDropdown = document.querySelector('.rows-per-page select');
    if (rowsDropdown) {
        rowsDropdown.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            applyFilters();
        });
    }
    
    // Bind Delete confirm
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteProduct);
    }
    
    // Load Data
    loadProducts();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initManageProductsPage);
} else {
    initManageProductsPage();
}

async function loadProducts() {
    const tableBodyId = 'productTableBody';
    showLoadingSkeleton(tableBodyId);
    
    try {
        const response = await fetchProducts();
        if (response && response.success && response.products) {
            allProducts = response.products;
            updateSummaryCards(allProducts);
            if (allProducts.length === 0) {
                showEmptyState(tableBodyId);
            } else {
                renderProducts(allProducts, tableBodyId);
                attachActionHandlers();
            }
        } else {
            updateSummaryCards([]);
            showErrorState(tableBodyId, loadProducts);
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        updateSummaryCards([]);
        showErrorState(tableBodyId, loadProducts);
    }
}

function attachActionHandlers() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            handleViewProduct(id);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            handleEditProduct(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            handleDeleteProduct(id);
        });
    });
}

function handleViewProduct(id) {
    const product = allProducts.find(p => p.id === id || p.productId === id || p._id === id);
    if (!product) {
        console.error('Product not found for view:', id);
        return;
    }
    
    // Set text elements
    const setElemText = (id, text) => { const el = document.getElementById(id); if(el) el.textContent = text; };
    
    setElemText('viewProductTitle', product.name || 'Unnamed Product');
    setElemText('viewProductSku', `SKU: ${product.sku || 'N/A'}`);
    setElemText('viewProductBrand', product.brand || 'N/A');
    setElemText('viewProductCategory', product.category || 'N/A');
    setElemText('viewProductDesc', product.description || 'No description available.');
    
    // Pricing & Inventory
    const formatCurrency = (val) => '₹' + (Number(val) || 0).toFixed(2);
    setElemText('viewProductPrice', formatCurrency(product.sellingPrice));
    setElemText('viewProductMrp', formatCurrency(product.mrp));
    setElemText('viewProductDiscount', `${product.discountPercentage || 0}% OFF`);
    setElemText('viewProductStock', `${product.quantity || 0} Units`);
    setElemText('viewProductThreshold', `${product.lowStockThreshold || 20} Units`);
    
    // Status badge
    const statusEl = document.getElementById('viewProductStatus');
    if (statusEl) {
        const statusUpper = (product.status || '').toUpperCase();
        statusEl.textContent = product.status || 'Unknown';
        statusEl.className = 'status-badge'; // reset
        if (statusUpper === 'ACTIVE') statusEl.classList.add('active');
        else if (statusUpper === 'INACTIVE') statusEl.classList.add('inactive');
    }
    
    // Image
    const imgEl = document.getElementById('viewProductImage');
    if (imgEl) {
        let imgUrl = product.imageUrl || product.image;
        if (imgUrl && imgUrl.includes('amazonaws.com')) {
            try {
                const parsed = new URL(imgUrl);
                imgUrl = `https://cloudbasket-products-personal-dhari.s3.ap-southeast-1.amazonaws.com${parsed.pathname}`;
            } catch (e) {}
        }
        const prodTitle = product.name || 'Product';
        let fallbackImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
        if (prodTitle.toLowerCase().includes('vivo')) {
            fallbackImg = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80';
        }
        if (!imgUrl || imgUrl.includes('placeholder')) {
            imgUrl = fallbackImg;
        }
        imgEl.src = imgUrl;
        imgEl.onerror = function() {
            this.onerror = null;
            this.src = fallbackImg;
        };
    }
    
    // Specifications
    const specsEl = document.getElementById('viewProductSpecs');
    if (specsEl) {
        specsEl.innerHTML = '';
        if (product.specifications && Array.isArray(product.specifications)) {
            product.specifications.forEach(spec => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${spec.name || 'Spec'}:</strong> ${spec.value || ''}`;
                specsEl.appendChild(li);
            });
        }
    }
    
    // Dates
    const formatDate = (dStr) => {
        if (!dStr) return 'N/A';
        const d = new Date(dStr);
        return isNaN(d) ? 'N/A' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    };
    
    setElemText('viewProductCreated', `Created: ${formatDate(product.createdAt)}`);
    setElemText('viewProductUpdated', `Last Updated: ${formatDate(product.updatedAt)}`);
    
    // Edit btn
    const editBtn = document.getElementById('viewProductEditBtn');
    if (editBtn) {
        editBtn.href = `edit-product.html?id=${id}`;
    }
    
    openViewModal(id);
}

function handleEditProduct(id) {
    window.location.href = `edit-product.html?id=${id}`;
}

let currentDeleteId = null;

function handleDeleteProduct(id) {
    currentDeleteId = id;
    openDeleteModal(id);
}

async function confirmDeleteProduct() {
    if (!currentDeleteId) return;
    
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmDeleteBtn.textContent;
    confirmDeleteBtn.textContent = 'Deleting...';
    confirmDeleteBtn.disabled = true;
    
    try {
        await deleteProductApi(currentDeleteId);
        closeDeleteModal();
        currentDeleteId = null;
        // Reload products
        loadProducts();
    } catch (error) {
        console.error('Failed to delete:', error);
        alert('Failed to delete product. Please try again.');
    } finally {
        confirmDeleteBtn.textContent = originalText;
        confirmDeleteBtn.disabled = false;
    }
}

function setupLayout() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    const productsMenuToggle = document.getElementById('productsMenuToggle');
    const productsGroup = productsMenuToggle?.closest('.sidebar-item-group');
    if (productsMenuToggle && productsGroup) {
        productsMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            productsGroup.classList.toggle('open');
        });
    }
    
    // Frontend search, filter and sort
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sortByFilter = document.getElementById('sortByFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    
    function onPageChange(newPage) {
        currentPage = newPage;
        applyFilters();
    }

    function applyFilters() {
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        const statusVal = statusFilter ? statusFilter.value.toLowerCase() : '';
        const sortVal = sortByFilter ? sortByFilter.value : '';
        
        let filtered = allProducts.filter(p => {
            const matchesSearch = (p.name && p.name.toLowerCase().includes(term)) ||
                                  (p.sku && p.sku.toLowerCase().includes(term));
            
            const matchesStatus = !statusVal || (p.status && p.status.toLowerCase() === statusVal);
            
            return matchesSearch && matchesStatus;
        });
        
        if (sortVal === 'price_asc') {
            filtered.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
        } else if (sortVal === 'price_desc') {
            filtered.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
        } else if (sortVal === 'newest') {
            filtered.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        }
        
        const tableBodyId = 'productTableBody';
        if(filtered.length === 0) {
            showEmptyState(tableBodyId);
            renderPaginationControls(0, 1, itemsPerPage, onPageChange);
        } else {
            // Paginate
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginated = filtered.slice(start, end);
            
            renderProducts(paginated, tableBodyId);
            attachActionHandlers();
            renderPaginationControls(filtered.length, currentPage, itemsPerPage, onPageChange);
        }
    }

    if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; applyFilters(); });
    if (statusFilter) statusFilter.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    if (sortByFilter) sortByFilter.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (statusFilter) statusFilter.value = '';
            if (sortByFilter) sortByFilter.value = '';
            currentPage = 1;
            applyFilters();
        });
    }
}
