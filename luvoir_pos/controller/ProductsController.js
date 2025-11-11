import ProductsModel from '../model/ProductsModel.js';
import { product_db } from '../db/db.js';

//Live Bootstrap validation
const form = document.getElementById('products-form');
let selectedImageBase64 = '';

//Handle image upload and preview
const imageInput = document.getElementById('inputGroupFile04');
const imagePreview = document.getElementById('imagePreview');

imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];

    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file!');
            imageInput.value = '';
            selectedImageBase64 = '';
            imagePreview.innerHTML = '<span class="text-muted">Preview</span>';
            return;
        }

        //Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB!');
            imageInput.value = '';
            selectedImageBase64 = '';
            imagePreview.innerHTML = '<span class="text-muted">Preview</span>';
            return;
        }

        //Read and convert to base64
        const reader = new FileReader();
        reader.onload = function(event) {
            selectedImageBase64 = event.target.result;

            //Preview
            imagePreview.innerHTML = `
                <img src="${selectedImageBase64}" 
                     alt="Product Preview" 
                     style="max-width: 200px; max-height: 200px; border: 1px solid #ddd; border-radius: 4px; padding: 5px;">
            `;
        };
        reader.readAsDataURL(file);
    } else {
        selectedImageBase64 = '';
        imagePreview.innerHTML = '<span class="text-muted">Preview</span>';
    }
});

const categoryDropdown = document.querySelector('#products .dropdown-menu');
const categoryInput = document.querySelector('#category').previousElementSibling;

categoryDropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        categoryInput.value = this.textContent;
    });
});

//Live validation for each input
form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => validateInput(input));
    input.addEventListener('blur', () => validateInput(input)); //check when user leaves the field
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

//Prevents form submission
form.addEventListener('submit', event => {
    event.preventDefault();
    event.stopPropagation();
});

function loadTable() {
    const tbody = document.querySelector('#products .table tbody');
    tbody.innerHTML = '';

    if (product_db.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No products available</td></tr>';
        return;
    }

    product_db.forEach(product => {
        const row = tbody.insertRow();

        //Image thumbnail
        const imageThumbnail = product.image
            ? `<img src="${product.image}" alt="Product" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`
            : 'No image';

        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.description}</td>
            <td>Rs. ${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.quantity}</td>
            <td>${product.category}</td>
            <td>${imageThumbnail}</td>
        `;

        //Click row to load data to fields
        row.addEventListener('click', () => {
            document.getElementById('product-id').value = product.id;
            document.getElementById('description').value = product.description;
            document.getElementById('price').value = product.price;
            document.getElementById('quantity').value = product.quantity;
            categoryInput.value = product.category;

            //Load image
            selectedImageBase64 = product.image;
            if (product.image) {
                imagePreview.innerHTML = `
                    <img src="${product.image}" 
                         alt="Product Preview" 
                         style="max-width: 200px; max-height: 200px; border: 1px solid #ddd; border-radius: 4px; padding: 5px;">
                `;
            } else {
                imagePreview.innerHTML = '<span class="text-muted">No image</span>';
            }

            //Validate data loaded to fields
            form.querySelectorAll('input[required]').forEach(input => {
                input.classList.add('is-valid');
                input.classList.remove('is-invalid');
            });
        });
    });
}

function clearForm() {
    document.getElementById('product-id').value = '';
    document.getElementById('description').value = '';
    document.getElementById('price').value = '';
    document.getElementById('quantity').value = '';
    categoryInput.value = '';
    document.getElementById('inputGroupFile04').value = '';
    selectedImageBase64 = '';
    imagePreview.innerHTML = '<span class="text-muted">Preview</span>';

    form.classList.remove('was-validated');
    form.querySelectorAll('input').forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
    });
}

//Save/Update
document.querySelector('#products .btn-success').addEventListener('click', function() {
    //Validate form
    const id = document.getElementById('product-id').value;
    const description = document.getElementById('description').value;
    const price = document.getElementById('price').value;
    const quantity = document.getElementById('quantity').value;
    const category = categoryInput.value;

    if (!id || !description || !price || !quantity || !category) {
        form.classList.add('was-validated');
        alert('Please fill all required fields correctly!');
        return;
    }

    if (parseFloat(price) <= 0) {
        alert('Price must be greater than 0!');
        return;
    }

    if (parseInt(quantity) < 0) {
        alert('Quantity cannot be negative!');
        return;
    }

    //Check Product
    const existingIndex = product_db.findIndex(p => p.id === id);

    if (existingIndex === -1) {
        const newProduct = new ProductsModel(
            id,
            description,
            parseFloat(price),
            parseInt(quantity),
            category,
            selectedImageBase64 //Use the uploaded image or an empty string if no image uploaded
        );
        product_db.push(newProduct);
        alert('Product saved successfully!');
    } else {
        //If a new image was uploaded use it, else keep the existing image
        const imageToSave = selectedImageBase64 || product_db[existingIndex].image;

        product_db[existingIndex] = new ProductsModel(
            id,
            description,
            parseFloat(price),
            parseInt(quantity),
            category,
            imageToSave
        );
        alert('Product updated successfully!');

    }

    loadTable();
    clearForm();
    console.log('Product DB:', product_db);
});

//Reset
document.querySelector('#products .btn-dark').addEventListener('click', function() {
    clearForm();
});

//Delete
document.querySelector('#products .btn-danger').addEventListener('click', function() {
    const id = document.getElementById('product-id').value;

    if (!id) {
        alert('Please select a product to delete!');
        return;
    }

    const index = product_db.findIndex(p => p.id === id);

    if (index === -1) {
        alert('Product not found!');
        return;
    }

    if (confirm(`Are you sure you want to delete product ${id}?`)) {
        product_db.splice(index, 1);
        alert('Product deleted successfully!');
        loadTable();
        clearForm();
        console.log('Product DB:', product_db);
    }
});

//Show current table data(initial load)
loadTable();