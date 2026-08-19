let selectedImage = null;

export function setSelectedImage(file) {
    selectedImage = file;
}

export function getSelectedImage() {
    return selectedImage;
}

export function clearSelectedImage() {
    selectedImage = null;
}
