document.addEventListener('DOMContentLoaded', function () {
    const editProductForm = document.getElementById('editProductForm');

    editProductForm.addEventListener('submit', function (event) {
        let isValid = true;

        // Reset error messages
        resetErrorMessages();

        // Validate Product Image
        // const productImageInput = editProductForm.querySelector('input[name="productimage"]');
        // if (productImageInput.files.length === 0) {
        //     displayError('productImageError', 'Please choose an image.');
        //     isValid = false;
        // }

        // Validate Product Name
        const productNameInput = editProductForm.querySelector('input[name="productname"]');
        if (productNameInput.value.trim() === '') {
            displayError('productNameError', 'Please enter a product name.');
            isValid = false;
        }

        // Validate Product Category
        const productCategorySelect = editProductForm.querySelector('select[name="category"]');
        if (productCategorySelect.value === '') {
            displayError('productCategoryError', 'Please select a product category.');
            isValid = false;
        }

        // Validate Current Quantity
        const currentQuantityInput = editProductForm.querySelector('input[name="currentqnt"]');
        if (isNaN(currentQuantityInput.value) || currentQuantityInput.value <= 0) {
            displayError('currentQuantityError', 'Please enter a valid current quantity.');
            isValid = false;
        }

        // Validate Price
        const priceInput = editProductForm.querySelector('input[name="price"]');
        if (isNaN(priceInput.value) || priceInput.value <= 0) {
            displayError('productPriceError', 'Please enter a valid price.');
            isValid = false;
        }

        // Validate Description
        const descriptionInput = editProductForm.querySelector('textarea[name="description"]');
        if (descriptionInput.value.trim() === '') {
            displayError('productDescriptionError', 'Please enter a product description.');
            isValid = false;
        }

        // Validate Size
        const sizeInput = editProductForm.querySelector('input[name="size"]');
        if (sizeInput.value.trim() === '') {
            displayError('productSizeError', 'Please enter a product size.');
            isValid = false;
        }

        // Add additional validations as needed

        if (!isValid) {
            event.preventDefault();
        }
    });

    function resetErrorMessages() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(function (error) {
            error.textContent = '';
        });
    }

    function displayError(id, message) {
        const errorElement = document.getElementById(id);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
});
