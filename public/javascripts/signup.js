function validateForm() {
    var username = document.getElementById('username').value;
    var email = document.getElementById('email').value;
    var phone = document.getElementById('phone').value;
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirm-password').value;

    // Reset previous error messages
    resetErrors();

    var isValid = true;

    // Validate username
if (!username.trim()) {
    displayError('username-error', 'Please enter your name');
    isValid = false;
} else if (!isValidUsername(username)) {
    displayError('username-error', 'Please enter a valid name (only letters are allowed)');
    isValid = false;
}

// ...

function isValidUsername(username) {
    // Only allow letters (no numbers or special characters)
    var usernameRegex = /^[A-Za-z]+$/;
    return usernameRegex.test(username);
}


    // Validate email
    if (!email.trim()) {
        displayError('email-error', 'Please enter your email');
        isValid = false;
    } else if (!isValidEmail(email)) {
        displayError('email-error', 'Please enter a valid email address');
        isValid = false;
    }

    // Validate phone
if (!phone.trim()) {
    displayError('phone-error', 'Please enter your phone number');
    isValid = false;
} else if (!isValidPhoneNumber(phone)) {
    displayError('phone-error', 'Please enter a valid phone number');
    isValid = false;
}

// ...

function isValidPhoneNumber(phone) {
    // Only allow numbers (0-9)
    var phoneRegex = /^\d+$/;
    return phoneRegex.test(phone);
}


    // Validate password
    if (!password.trim()) {
        displayError('password-error', 'Please enter a password');
        isValid = false;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
        displayError('confirm-password-error', 'Passwords do not match');
        isValid = false;
    }

    return isValid;
}

function resetErrors() {
    var errorElements = document.querySelectorAll('.text-danger');
    errorElements.forEach(function (element) {
        element.textContent = '';
    });
}

function displayError(id, message) {
    var errorElement = document.getElementById(id);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function isValidEmail(email) {
    // Simple email validation
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
