

    const editcategory = document.getElementById('editcategory');

    editcategory.addEventListener('submit', (e) => {
        e.preventDefault();

        const categoryName = document.getElementById('categoryname').value;
        const categoryImage = document.getElementById('categoryimage').files;
        const categoryDescription = document.getElementById('categorydescription').value;

        let hasError = false;

        // Clear previous error messages
        const errorSpans = document.querySelectorAll('.error-message');
        errorSpans.forEach(span => {
            span.textContent = '';
        });

        // Category Name validation
        if (categoryName.trim() === '') {
            document.getElementById('categorynameerror').textContent = 'Category Name is required';
            hasError = true;
        }

        // Category Image validation
        if (categoryImage.length > 0) {
            const allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            for (let i = 0; i < categoryImage.length; i++) {
                if (!allowedFormats.includes(categoryImage[i].type)) {
                    document.getElementById('categoryimageerror').textContent = 'Invalid image format. Allowed formats: JPG, PNG, GIF';
                    hasError = true;
                    break;
                }
            }
        }
        // Description validation
        if (categoryDescription.trim() === '') {
            document.getElementById('categorydescriptionerror').textContent = 'Description is required';
            hasError = true;
        }

        if (!hasError) {
            editcategory.submit(); // Submit the form if there are no errors
        }
    });
