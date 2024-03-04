function validateForm() {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  var errorMessageElement = document.getElementById('form-error-message');

  // Reset previous error message
  errorMessageElement.textContent = '';

  // Simple validation: check if the fields are not empty
  if (email.trim() === '' || password.trim() === '') {
      errorMessageElement.textContent = 'Please fill out all fields';
      return false; // prevent form submission
  }

  return true; // allow form submission
}
