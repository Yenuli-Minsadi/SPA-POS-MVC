import CustomerModel from '../model/CustomerModel.js';
import { customer_db } from '../db/db.js';

//Live Bootstrap validation
const form = document.getElementById('customer-form');

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

//Prevents form submission if invalid
document.querySelector('#customer-form').addEventListener('submit', event => {
    const form = event.target;
    if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
    }
    form.classList.add('was-validated');
});

function loadTable() {
    const tbody = document.querySelector('#customers .table tbody');
    tbody.innerHTML = '';

    if (customer_db.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No customers available</td></tr>';
        return;
    }

    customer_db.forEach(customer => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.nic}</td>
            <td>${customer.address}</td>
            <td>${customer.email}</td>
            <td>${customer.contactNumber}</td>
        `;

        //Click row to load data to fields
        row.addEventListener('click', () => {
            document.getElementById('customerID').value = customer.id;
            document.getElementById('fullname').value = customer.name;
            document.getElementById('nic').value = customer.nic;
            document.getElementById('address').value = customer.address;
            document.getElementById('email').value = customer.email;
            document.getElementById('phone').value = customer.contactNumber;

            //Validate data loaded to fields
            form.querySelectorAll('input').forEach(input => {
                input.classList.add('is-valid');
                input.classList.remove('is-invalid');
            });
        });
    });
}

function clearForm() {
    document.getElementById('customerID').value = '';
    document.getElementById('fullname').value = '';
    document.getElementById('nic').value = '';
    document.getElementById('address').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';

    form.classList.remove('was-validated');
    form.querySelectorAll('input').forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
    });
}

//Save/Update
document.querySelector('#customers .btn-success').addEventListener('click', function() {
    //Validate form
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        alert('Please fill all fields correctly!');
        return;
    }

    const id = document.getElementById('customerID').value;
    const name = document.getElementById('fullname').value;
    const nic = document.getElementById('nic').value;
    const address = document.getElementById('address').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    //Check Customer
    const existingIndex = customer_db.findIndex(c => c.id === id);

    if (existingIndex === -1) {
        const newCustomer = new CustomerModel(id, name, nic, address, email, phone);
        customer_db.push(newCustomer);
        alert('Customer saved successfully!');
    } else {
        customer_db[existingIndex] = new CustomerModel(id, name, nic, address, email, phone);
        alert('Customer updated successfully!');
    }


    loadTable();
    clearForm();
    console.log('Customer DB:', customer_db);
});

//Reset
document.querySelector('#customers .btn-dark').addEventListener('click', function() {
    clearForm();
});

//Delete
document.querySelector('#customers .btn-danger').addEventListener('click', function() {
    const id = document.getElementById('customerID').value;

    if (!id) {
        alert('Please select a customer to delete!');
        return;
    }

    const index = customer_db.findIndex(c => c.id === id);

    if (index === -1) {
        alert('Customer not found!');
        return;
    }

    if (confirm(`Are you sure you want to delete customer ${id}?`)) {
        customer_db.splice(index, 1);
        alert('Customer deleted successfully!');
        loadTable();
        clearForm();
        console.log('Customer DB:', customer_db);
    }
});

//Show current table data(initial load)
loadTable();

