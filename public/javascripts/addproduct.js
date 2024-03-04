// form-validation.js

document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.mega-form');

    form.addEventListener('submit', function (event) {
        let isValid = true;

        // Validate Product Name
        const productName = form.querySelector('[name="name"]').value.trim();
        if (!productName) {
            displayError('name-error', 'Please enter a Product Name');
            isValid = false;
        } else {
            clearError('name-error');
        }

        // Validate Product Category
        const productCategory = form.querySelector('[name="category"]').value;
        if (!productCategory) {
            displayError('category-error', 'Please select a Product Category');
            isValid = false;
        } else {
            clearError('category-error');
        }

        // Validate Current Quantity
        const currentQuantity = form.querySelector('[name="currentQuantity"]').value;
        if (!currentQuantity.trim() || isNaN(currentQuantity) || currentQuantity < 0) {
            displayError('currentQuantity-error', 'Please enter a valid Current Quantity');
            isValid = false;
        } else {
            clearError('currentQuantity-error');
        }

        // Validate Price
        const price = form.querySelector('[name="price"]').value;
        if (!price.trim() || isNaN(price) || price < 0) {
            displayError('price-error', 'Please enter a valid Price');
            isValid = false;
        } else {
            clearError('price-error');
        }

        // Validate Description
        const description = form.querySelector('[name="description"]').value.trim();
        if (!description) {
            displayError('description-error', 'Please enter a Description');
            isValid = false;
        } else {
            clearError('description-error');
        }

        // Validate Size
        const size = form.querySelector('[name="size"]').value.trim();
        if (!size) {
            displayError('size-error', 'Please enter a Size');
            isValid = false;
        } else {
            clearError('size-error');
        }

        // Validate Product Image (Assuming at least one image is required)
        const productImageInput = form.querySelector('[name="productimage"]');
        const productImage = productImageInput.files;

        // Check if any file is selected
        if (productImage.length === 0) {
            displayError('productimage-error', 'Please choose at least one Product Image');
            isValid = false;
        } else {
            // Check the file type for each selected file
            for (const file of productImage) {
                const fileType = file.type.toLowerCase();

                // Check if the file type is an image
                if (fileType.startsWith('image/')) {
                    // It's an image, do nothing
                } else {
                    // Display an error if a non-image file is selected
                    displayError('productimage-error', 'Please choose only image files');
                    isValid = false;
                    break; // Exit the loop early if a non-image file is found
                }
            }
        }

        if (!isValid) {
            event.preventDefault(); // Prevent form submission if validation fails
        } else {
            // Clear all error messages when the form is valid
            clearAllErrors();
        }
    });

    // Add event listeners to clear individual error messages when the corresponding input field is updated
    form.querySelector('[name="name"]').addEventListener('input', function () {
        clearError('name-error');
    });

    form.querySelector('[name="category"]').addEventListener('change', function () {
        clearError('category-error');
    });

    form.querySelector('[name="currentQuantity"]').addEventListener('input', function () {
        clearError('currentQuantity-error');
    });

    form.querySelector('[name="price"]').addEventListener('input', function () {
        clearError('price-error');
    });

    form.querySelector('[name="description"]').addEventListener('input', function () {
        clearError('description-error');
    });

    form.querySelector('[name="size"]').addEventListener('input', function () {
        clearError('size-error');
    });

    form.querySelector('[name="productimage"]').addEventListener('change', function () {
        clearError('productimage-error');
    });

    function displayError(elementId, errorMessage) {
        const errorElement = document.getElementById(elementId);
        errorElement.innerText = errorMessage;
        errorElement.style.display = 'block';
    }

    function clearError(elementId) {
        const errorElement = document.getElementById(elementId);
        errorElement.innerText = '';
        errorElement.style.display = 'none';
    }

    function clearAllErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(function (errorElement) {
            errorElement.innerText = '';
            errorElement.style.display = 'none';
        });
    }
});
