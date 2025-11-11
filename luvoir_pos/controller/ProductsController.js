// Live Bootstrap validation
const form = document.getElementById('products-form');

// Live validation for each input
form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => validateInput(input));
    input.addEventListener('blur', () => validateInput(input)); // also check when user leaves the field
});

function validateInput(input) {
    if (input.checkValidity()) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
    }
}

// Prevent form submission if invalid
document.querySelector('#customer-form').addEventListener('submit', event => {
    const form = event.target;
    if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
    }
    form.classList.add('was-validated');
});