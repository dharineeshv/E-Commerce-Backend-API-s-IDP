// ==========================================================
// CloudBasket Admin Panel
// Add Product Module
// Part 1
// =====...=====================================================

import {
    uploadProductImage,
    createProduct
} from "./api/addProductApi.js";
import { getProductById, updateProductApi } from "./api/productApi.js";

import { showToast } from "./utils/toast.js";

import { validateProduct } from "./utils/validation.js";


import { initializeLogout } from "./logout.js";
import { initializeSidebar } from "./sidebar.js";

// ==========================================================
// DOM Ready
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {



    initializeSidebar();
    initialize();
    initializeLogout();

});

// ==========================================================
// Global State
// ==========================================================

let selectedImages = [];
let uploadedImages = [];
let isEditMode = false;
let editProductId = null;
let existingProductImages = [];


// ==========================================================
// Cached DOM
// ==========================================================

const form =
    document.getElementById("productForm");

const browseButton =
    document.getElementById("browseBtn");

const imageInput =
    document.getElementById("imageInput");

const dropzone =
    document.getElementById("dropzone");

const removeImageButton =
    document.getElementById("removeImageBtn");

const previewImage =
    document.getElementById("previewImg");

const defaultPreviewItem =
    document.getElementById("defaultPreviewItem");

const publishButton =
    document.getElementById("publishFormBtn");

const cancelButton =
    document.getElementById("cancelFormBtn");

// ==========================================================
// Initialization
// ==========================================================

function initialize() {
    initializeImageUpload();
    initializeDragAndDrop();
    
    const urlParams = new URLSearchParams(window.location.search);
    editProductId = urlParams.get('id');
    if (editProductId) {
        isEditMode = true;
        document.querySelector('h1').textContent = 'Edit Product';
        publishButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Save Changes
        `;
        loadProductForEditing();
    }
    

}

async function loadProductForEditing() {
    try {
        const response = await getProductById(editProductId);
        if (response && response.product) {
            populateForm(response.product);
        }
    } catch (error) {
        console.error('Failed to load product details:', error);
        showToast('Failed to load product details.', 'error');
    }
}

function populateForm(product) {
    productName.value = product.name || '';
    productBrand.value = product.brand || '';
    productCategory.value = product.category || '';
    productDescription.value = product.description || '';
    skuInput.value = product.sku || '';
    mrpInput.value = product.mrp !== undefined ? product.mrp : '';
    discountInput.value = product.discountPercentage !== undefined ? product.discountPercentage : '';
    sellingPriceInput.value = product.sellingPrice !== undefined ? product.sellingPrice : '';
    quantityInput.value = product.quantity !== undefined ? product.quantity : '';
    thresholdInput.value = product.lowStockThreshold !== undefined ? product.lowStockThreshold : '';
    
    if (product.status) {
        const statusRadio = document.querySelector(`input[name="prodStatus"][value="${product.status.toLowerCase()}"]`);
        if (statusRadio) statusRadio.checked = true;
    }
    
    
    if (product.images && product.images.length > 0) {
        existingProductImages = product.images;
        previewImage.src = product.images[0].imageUrl;
        previewImage.style.display = 'block';
        if(defaultPreviewItem) defaultPreviewItem.style.display = 'none';
        
        renderThumbnails();
    } else if (product.imageUrl) {
        existingProductImages = [{ imageUrl: product.imageUrl, imageKey: product.imageKey || null }];
        previewImage.src = product.imageUrl;
        previewImage.style.display = 'block';
        if(defaultPreviewItem) defaultPreviewItem.style.display = 'none';
        
        renderThumbnails();
    }

    
    // Specifications
    if (product.specifications) {
        const specsContainer = document.getElementById("specsList");
        if (specsContainer) {
            specsContainer.innerHTML = '';
            
            let specsObj = {};
            if (typeof product.specifications === 'string') {
                if (product.specifications.startsWith('@{')) {
                    const inner = product.specifications.slice(2, -1);
                    const pairs = inner.split(';');
                    pairs.forEach(p => {
                        const parts = p.split('=');
                        if (parts.length === 2) {
                            specsObj[parts[0].trim()] = parts[1].trim();
                        }
                    });
                } else {
                    try { specsObj = JSON.parse(product.specifications); } catch(e){}
                }
            } else if (typeof product.specifications === 'object') {
                specsObj = product.specifications;
            }

            Object.entries(specsObj).forEach(([key, value]) => {
                const row = document.createElement("div");
                row.className = "spec-row";
                row.innerHTML = `
                    <div class="form-group">
                        <input type="text" class="spec-key" placeholder="Specification Name" value="${key}">
                    </div>
                    <div class="form-group">
                        <input type="text" class="spec-value" placeholder="Value" value="${value}">
                    </div>
                    <button type="button" class="delete-spec-btn">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                `;
                
                const removeBtn = row.querySelector(".delete-spec-btn");
                removeBtn.addEventListener("click", () => {
                    row.remove();
                    if(typeof renderSpecificationPreview === 'function') renderSpecificationPreview();
                });
                specsContainer.appendChild(row);
                
                const inputs = row.querySelectorAll("input");
                inputs.forEach(input => input.addEventListener("input", () => {
                    if(typeof renderSpecificationPreview === 'function') renderSpecificationPreview();
                }));
            });
        }
    }
    
    // Force preview update
    setTimeout(() => {
        if(typeof updatePreview === 'function') updatePreview();
        if(typeof calculatePrice === 'function') calculatePrice();
        if(typeof updateStatusPreview === 'function') updateStatusPreview();
        if(typeof renderSpecificationPreview === 'function') renderSpecificationPreview();
    }, 100);
}

// ==========================================================
// Browse Image
// ==========================================================

function initializeImageUpload() {

    browseButton.addEventListener(

        "click",

        () => {

            imageInput.click();

        }

    );

    imageInput.addEventListener(

        "change",

        handleImageSelection

    );

    removeImageButton.addEventListener(

        "click",

        removeSelectedImage

    );

}

// ==========================================================
// Image Selected
// ==========================================================


function handleImageSelection(event) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        if (!file.type.startsWith("image/")) {
            showToast("Please select valid images.", "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast("Maximum image size is 5 MB.", "error");
            return;
        }
        selectedImages.push(file);
    });
    
    renderThumbnails();
}



// ==========================================================
// Preview Image
// ==========================================================


function renderThumbnails() {
    const previewsGrid = document.getElementById('previewsGrid');
    if(previewsGrid) previewsGrid.innerHTML = '';
    
    // Render existing images
    existingProductImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML = `<img src="${img.imageUrl}" alt="Existing image"><button type="button" class="remove-image show" onclick="removeExistingImage(${index})">×</button>`;
        if(previewsGrid) previewsGrid.appendChild(item);
        if (index === 0) previewImage.src = img.imageUrl;
    });
    
    // Render new images
    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            item.innerHTML = `<img src="${e.target.result}" alt="New image"><button type="button" class="remove-image show" onclick="removeSelectedImage(${index})">×</button>`;
            if(previewsGrid) previewsGrid.appendChild(item);
            
            if (existingProductImages.length === 0 && index === 0) {
                previewImage.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    });
    
    if (existingProductImages.length === 0 && selectedImages.length === 0) {
        if(previewsGrid) previewsGrid.innerHTML = `<div class="image-preview-item" id="defaultPreviewItem"><img src="https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=400&q=80" alt="Default Product Image"></div>`;
        previewImage.src = "https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=400&q=80";
    }
}

window.removeExistingImage = function(index) {
    existingProductImages.splice(index, 1);
    renderThumbnails();
};

window.removeSelectedImage = function(index) {
    selectedImages.splice(index, 1);
    imageInput.value = "";
    renderThumbnails();
};

// ==========================================================
// Remove Image
// ==========================================================


// ==========================================================
// Drag & Drop
// ==========================================================

function initializeDragAndDrop() {

    dropzone.addEventListener(

        "dragover",

        (event) => {

            event.preventDefault();

            dropzone.classList.add(

                "drag-active"

            );

        }

    );

    dropzone.addEventListener(

        "dragleave",

        () => {

            dropzone.classList.remove(

                "drag-active"

            );

        }

    );

    dropzone.addEventListener(

        "drop",

        (event) => {

            event.preventDefault();

            dropzone.classList.remove(

                "drag-active"

            );

            const file =

                event.dataTransfer.files[0];

            if (!file) {

                return;

            }

            selectedImage = file;

            renderSelectedImage(file);

        }

    );

}



// ==========================================================
// LIVE PREVIEW
// ==========================================================

const productName =
    document.getElementById("prodName");

const productBrand =
    document.getElementById("prodBrand");

const productCategory =
    document.getElementById("prodCategory");

const productDescription =
    document.getElementById("prodDesc");

const skuInput =
    document.getElementById("invSku");

const quantityInput =
    document.getElementById("invQty");

const thresholdInput =
    document.getElementById("invThreshold");

const mrpInput =
    document.getElementById("priceMrp");

const discountInput =
    document.getElementById("priceDiscount");

const sellingPriceInput =
    document.getElementById("priceSelling");

// ==========================================================
// Preview Elements
// ==========================================================

const previewTitle =
    document.getElementById("previewTitle");

const previewCategory =
    document.getElementById("previewCategory");

const previewSku =
    document.getElementById("previewSkuRef");

const previewSellingPrice =
    document.getElementById("previewPriceSelling");

const previewMrp =
    document.getElementById("previewPriceMrp");

const previewDiscount =
    document.getElementById("previewPriceDiscount");

const previewStock =
    document.getElementById("previewStockQty");

const previewStatusText =
    document.getElementById("previewStatusText");

const previewStatusBadge =
    document.getElementById("previewStatusBadge");

// ==========================================================
// Initialize Preview
// ==========================================================

initializePreview();

function initializePreview() {

    productName.addEventListener(
        "input",
        updatePreview
    );

    productBrand.addEventListener(
        "change",
        updatePreview
    );

    productCategory.addEventListener(
        "change",
        updatePreview
    );

    skuInput.addEventListener(
        "input",
        updatePreview
    );

    quantityInput.addEventListener(
        "input",
        updatePreview
    );

    mrpInput.addEventListener(
        "input",
        calculatePrice
    );

    discountInput.addEventListener(
        "input",
        calculatePrice
    );

    document
        .querySelectorAll(
            "input[name='prodStatus']"
        )
        .forEach((radio) => {

            radio.addEventListener(
                "change",
                updateStatusPreview
            );

        });

}

// ==========================================================
// Update Preview
// ==========================================================

function updatePreview() {

    previewTitle.textContent =
        productName.value ||
        "Product Name";

    previewCategory.textContent =
        productCategory.value ||
        "Category";

    previewSku.textContent =
        skuInput.value
            ? `Product Reference : ${skuInput.value}`
            : "Product Reference";

    previewStock.textContent =
        quantityInput.value
            ? `${quantityInput.value} Units`
            : "0 Units";

}

// ==========================================================
// Price Calculation
// ==========================================================

function calculatePrice() {

    const mrp =
        Number(mrpInput.value || 0);

    const discount =
        Number(
            discountInput.value || 0
        );

    const sellingPrice =
        mrp -
        (mrp * discount) / 100;

    sellingPriceInput.value =
        sellingPrice.toFixed(2);

    previewSellingPrice.textContent =
        `\u20B9${sellingPrice.toFixed(2)}`;

    previewMrp.textContent =
        `\u20B9${mrp.toFixed(2)}`;

    previewDiscount.textContent =
        `-${discount}%`;

}

// ==========================================================
// Status Preview
// ==========================================================

function updateStatusPreview() {

    const status =
        document.querySelector(
            "input[name='prodStatus']:checked"
        ).value;

    previewStatusText.textContent =
        status;

    previewStatusBadge.textContent =
        status;

    previewStatusBadge.classList.remove(
        "active",
        "inactive"
    );

    if (status === "Active") {

        previewStatusBadge.classList.add(
            "active"
        );

    } else {

        previewStatusBadge.classList.add(
            "inactive"
        );

    }

}




// ==========================================================
// SPECIFICATIONS MODULE
// ==========================================================

const specsList =
    document.getElementById("specsList");

const addSpecButton =
    document.getElementById("addSpecBtn");

const previewSpecsGrid =
    document.getElementById("previewSpecsGrid");

// ==========================================================
// Initialize
// ==========================================================

initializeSpecifications();

function initializeSpecifications() {

    addSpecificationRow();

    addSpecButton.addEventListener(

        "click",

        addSpecificationRow

    );

}

// ==========================================================
// Add Specification Row
// ==========================================================

function addSpecificationRow() {

    const row = document.createElement("div");

    row.className = "spec-row";

    row.innerHTML = `

        <div class="form-group">

            <input
                type="text"
                class="spec-key"
                placeholder="Specification Name">

        </div>

        <div class="form-group">

            <input
                type="text"
                class="spec-value"
                placeholder="Value">

        </div>

        <button
            type="button"
            class="delete-spec-btn">

            <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2">

                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"/>

            </svg>

        </button>

    `;

    specsList.appendChild(row);

    row
        .querySelector(".spec-key")
        .addEventListener(
            "input",
            renderSpecificationPreview
        );

    row
        .querySelector(".spec-value")
        .addEventListener(
            "input",
            renderSpecificationPreview
        );

    row
        .querySelector(".delete-spec-btn")
        .addEventListener(
            "click",
            () => {

                row.remove();

                renderSpecificationPreview();

            }
        );

}

// ==========================================================
// Preview Specifications
// ==========================================================

function renderSpecificationPreview() {

    previewSpecsGrid.innerHTML = "";

    const rows =
        document.querySelectorAll(".spec-row");

    rows.forEach((row) => {

        const key =
            row.querySelector(".spec-key").value.trim();

        const value =
            row.querySelector(".spec-value").value.trim();

        if (!key || !value) {

            return;

        }

        const item =
            document.createElement("div");

        item.className =
            "preview-spec-item";

        item.innerHTML = `

            <span class="spec-title">

                ${key}

            </span>

            <span class="spec-value">

                ${value}

            </span>

        `;

        previewSpecsGrid.appendChild(item);

    });

}

// ==========================================================
// Return Specifications Object
// ==========================================================

function collectSpecifications() {

    const specifications = {};

    document

        .querySelectorAll(".spec-row")

        .forEach((row) => {

            const key =
                row.querySelector(".spec-key").value.trim();

            const value =
                row.querySelector(".spec-value").value.trim();

            if (key && value) {

                specifications[key] = value;

            }

        });

    return specifications;

}



// ==========================================================
// PUBLISH PRODUCT
// ==========================================================

const successModal =
    document.getElementById("successModal");

const modalProductName =
    document.getElementById("modalProductName");

const addAnotherButton =
    document.getElementById("modalAddAnother");

const viewProductsButton =
    document.getElementById("modalViewProducts");

// ==========================================================
// Publish Button
// ==========================================================

publishButton.addEventListener(

    "click",

    publishProduct

);

// ==========================================================
// Publish Product
// ==========================================================

async function publishProduct(event) {

    event.preventDefault();

    try {

        publishButton.disabled = true;

        publishButton.innerHTML = `
<div class="spinner"></div>
Publishing...
`;

        // ===============================
        // Validation
        // ===============================


        if (selectedImages.length === 0 && existingProductImages.length === 0) {
            showToast("Please select at least one product image.", "error");
            resetPublishButton();
            return;
        }

        // Upload Images
        for (const file of selectedImages) {
            const uploadResponse = await uploadProductImage(file);
            if (!uploadResponse || !uploadResponse.success) {
                throw new Error(uploadResponse?.message || "Image upload failed.");
            }
            uploadedImages.push({
                imageKey: uploadResponse.imageKey,
                imageUrl: uploadResponse.imageUrl
            });
        }
        
        const finalImages = [...existingProductImages, ...uploadedImages];


        // ===============================
        // Product Object
        // ===============================

        const product = {

            name:

                productName.value.trim(),

            brand:

                productBrand.value,

            category:

                productCategory.value,

            description:

                productDescription.value.trim(),

            sku:

                skuInput.value.trim(),

            mrp:

                Number(

                    mrpInput.value

                ),

            discountPercentage:

                Number(

                    discountInput.value || 0

                ),

            sellingPrice:

                Number(

                    sellingPriceInput.value

                ),

            quantity:

                Number(

                    quantityInput.value

                ),

            lowStockThreshold:

                Number(

                    thresholdInput.value ||

                    5

                ),


            images: finalImages,
            imageUrl: finalImages.length > 0 ? finalImages[0].imageUrl : '',
            imageKey: finalImages.length > 0 ? finalImages[0].imageKey : '',


            specifications:

                collectSpecifications(),

            status:

                document.querySelector(

                    "input[name='prodStatus']:checked"

                ).value.toUpperCase()

        };

        // ===============================
        // Validation
        // ===============================

        if (

            !validateProduct(product)

        ) {

            resetPublishButton();

            return;

        }

        let response;
        if (isEditMode) {
            response = await updateProductApi(editProductId, product);
        } else {
            response = await createProduct(product);
        }

        if (

            !response.success

        ) {

            throw new Error(

                response.message ||

                "Failed to create product."

            );

        }

        // ===============================
        // Success
        // ===============================

        const modalProductName = document.getElementById('modalProductName');
        if (modalProductName) modalProductName.textContent = `"${product.name}"`;
        
        const modalHeading = document.querySelector('#successModal h3');
        if (modalHeading) modalHeading.textContent = isEditMode ? 'Changes Saved Successfully' : 'Product Created Successfully';
        
        const modalPara = document.querySelector('#successModal p');
        if (modalPara) modalPara.innerHTML = isEditMode ? `Your product <span class="modal-product-name" id="modalProductName">"${product.name}"</span> has been successfully updated.` : `Your new product <span class="modal-product-name" id="modalProductName">"${product.name}"</span> is now live.`;
        
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('active', 'show');
            modal.style.display = 'flex';
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
        }

        showToast(

            "Product published successfully.",

            "success"

        );

    }

    catch (error) {

        console.error(error);

        showToast(

            error.message,

            "error"

        );

    }

    finally {

        resetPublishButton();

    }

}

// ==========================================================
// Reset Publish Button
// ==========================================================

function resetPublishButton() {

    publishButton.disabled = false;

    publishButton.innerHTML = `

        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5">

            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4v16m8-8H4"/>

        </svg>

        Publish Product

    `;

}



// ==========================================================
// SUCCESS MODAL
// ==========================================================

function goToManageProducts() {
    const path = window.location.pathname;
    if (path.includes("/dashboard/products/")) {
        window.location.href = "../../products/manage-products.html";
    } else {
        window.location.href = "manage-products.html";
    }
}

if (addAnotherButton) {
    addAnotherButton.addEventListener("click", (e) => {
        e.preventDefault();
        resetEntireForm();
    });
}

if (viewProductsButton) {
    viewProductsButton.addEventListener("click", (e) => {
        e.preventDefault();
        goToManageProducts();
    });
}

document.addEventListener("click", (event) => {
    const viewBtn = event.target.closest('#modalViewProducts, .btn-view-products');
    if (viewBtn) {
        event.preventDefault();
        event.stopPropagation();
        goToManageProducts();
        return;
    }

    const addAnotherBtn = event.target.closest('#modalAddAnother, .btn-add-another');
    if (addAnotherBtn) {
        event.preventDefault();
        event.stopPropagation();
        resetEntireForm();
        return;
    }
}, true);

// ==========================================================
// Cancel Button
// ==========================================================

cancelButton.addEventListener(

    "click",

    () => {

        if (

            confirm(

                "Discard all changes?"

            )

        ) {

            resetEntireForm();

        }

    }

);

// ==========================================================
// Close Modal Outside Click
// ==========================================================

window.addEventListener(

    "click",

    (event) => {

        if (

            event.target === successModal

        ) {

            successModal.classList.remove(

                "show"

            );

        }

    }

);

// ==========================================================
// Reset Entire Form
// ==========================================================

function resetEntireForm() {
    if (form) form.reset();

    const modal = document.getElementById('successModal') || successModal;
    if (modal) {
        modal.classList.remove("show", "active");
        modal.style.display = "none";
        modal.style.opacity = "0";
        modal.style.visibility = "hidden";
    }

    selectedImage = null;

    uploadedImage = null;

    imageInput.value = "";

    previewImage.src =
        "https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=400&q=80";

    // ===========================
    // Preview Reset
    // ===========================

    previewTitle.textContent =
        "Product Name";

    previewCategory.textContent =
        "Category";

    previewSku.textContent =
        "Product Reference";

    previewSellingPrice.textContent =
        "$0.00";

    previewMrp.textContent =
        "$0.00";

    previewDiscount.textContent =
        "-0%";

    previewStock.textContent =
        "0 Units";

    previewStatusText.textContent =
        "Active";

    previewStatusBadge.textContent =
        "Active";

    previewStatusBadge.classList.remove(

        "inactive"

    );

    previewStatusBadge.classList.add(

        "active"

    );

    // ===========================
    // Specifications
    // ===========================

    specsList.innerHTML = "";

    previewSpecsGrid.innerHTML = "";

    addSpecificationRow();

    // ===========================
    // Price
    // ===========================

    sellingPriceInput.value = "";

    // ===========================
    // Toast
    // ===========================

    showToast(

        "Ready to add another product.",

        "success"

    );

}

// ==========================================================
// INITIAL VALUES
// ==========================================================

updatePreview();

calculatePrice();

updateStatusPreview();
