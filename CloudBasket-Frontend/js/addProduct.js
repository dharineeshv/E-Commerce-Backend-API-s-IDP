// ==========================================================
// CloudBasket Admin Panel
// Add Product Module
// Part 1
// ==========================================================

import {
    uploadProductImage,
    createProduct
} from "./api/addProductApi.js";

import { showToast } from "./utils/toast.js";

import { validateProduct } from "./utils/validation.js";


// ==========================================================
// DOM Ready
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ Add Product Loaded");

    initialize();

});

// ==========================================================
// Global State
// ==========================================================

let selectedImage = null;

let uploadedImage = null;

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

    console.log("✅ Initialization Complete");

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

    const file = event.target.files[0];

    if (!file) {

        return;

    }

    if (

        !file.type.startsWith("image/")

    ) {

        showToast(

            "Please select a valid image.",

            "error"

        );

        return;

    }

    if (

        file.size >

        5 * 1024 * 1024

    ) {

        showToast(

            "Maximum image size is 5 MB.",

            "error"

        );

        return;

    }

    selectedImage = file;

    renderSelectedImage(file);

}

// ==========================================================
// Preview Image
// ==========================================================

function renderSelectedImage(file) {

    const reader =
        new FileReader();

    reader.onload = function (event) {

        previewImage.src =
            event.target.result;

        defaultPreviewItem.style.display =
            "block";

    };

    reader.readAsDataURL(file);

}

// ==========================================================
// Remove Image
// ==========================================================

function removeSelectedImage() {

    selectedImage = null;

    imageInput.value = "";

    previewImage.src =
        "https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=400&q=80";

    showToast(

        "Image removed",

        "success"

    );

}

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

console.log("✅ Part 1 Loaded");

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
        `$${sellingPrice.toFixed(2)}`;

    previewMrp.textContent =
        `$${mrp.toFixed(2)}`;

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

console.log("✅ Part 2 Loaded");


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

console.log("✅ Part 3 Loaded");

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

        if (!selectedImage) {

            showToast(

                "Please select a product image.",

                "error"

            );

            resetPublishButton();

            return;

        }

        // ===============================
        // Upload Image
        // ===============================

        const uploadResponse =

            await uploadProductImage(

                selectedImage

            );

        if (

            !uploadResponse.success

        ) {

            throw new Error(

                uploadResponse.message ||

                "Image upload failed."

            );

        }

        uploadedImage = uploadResponse;

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

            imageKey:

                uploadResponse.imageKey,

            imageUrl:

                uploadResponse.imageUrl,

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

        // ===============================
        // Create Product
        // ===============================

        const response =

            await createProduct(

                product

            );

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

        modalProductName.textContent =

            product.name;

        successModal.classList.add(

            "show"

        );

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

console.log("✅ Part 4A Loaded");

// ==========================================================
// SUCCESS MODAL
// ==========================================================

addAnotherButton.addEventListener(

    "click",

    resetEntireForm

);

viewProductsButton.addEventListener(

    "click",

    () => {

        window.location.href =
            "products.html";

    }

);

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

    form.reset();

    successModal.classList.remove(

        "show"

    );

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

console.log(

    "✅ Part 4B Loaded"

);