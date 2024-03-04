function validateForm() {
    var name = document.getElementById('name').value;
    var categoryImage = document.getElementById('categoryimage').value;
    var description = document.getElementById('description').value;


    if ( !name.trim() && !categoryImage.trim() && !description.trim()) {
        displayError('all-error', 'Please fill in all fields.');
        return false; // prevent form submission
    }
    // Simple validation: check if the fields are not empty
    if (!name.trim()) {
        displayError('name-error', 'Please enter a Category Name');
        return false; // prevent form submission
    }

    // Validate category image
    if (!validateCategoryImage()) {
        return false; // prevent form submission
    }

    // Simple validation: check if the description is not empty
    if (!description.trim()) {
        displayError('description-error', 'Please enter a Description');
        return false; // prevent form submission
    }

    return true; // allow form submission
}

function validateCategoryImage() {
    var categoryImageInput = document.getElementById('categoryimage');
    var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.webp)$/i;

    if (!categoryImageInput.files.length) {
        displayError('categoryimage-error', 'Please select a Category Image');
        return false;
    }

    var fileName = categoryImageInput.value;
    if (!allowedExtensions.exec(fileName)) {
        displayError('categoryimage-error', 'Invalid file type. Please select a jpg, jpeg, or png file.');
        return false;
    }

    return true;
}

function displayError(elementId, message) {
    var errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.innerText = message;
    }
}

// Additional event listener to clear errors on input change
document.addEventListener('input', function (event) {
    var errorDivs = document.querySelectorAll('.alert-message');
    if (errorDivs) {
        errorDivs.forEach(function (div) {
            div.innerText = '';
        });
    }
});
