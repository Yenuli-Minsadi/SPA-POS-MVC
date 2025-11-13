import OrderModel from '../model/OrderModel.js';
import { order_db, customer_db } from '../db/db.js';

let currentOrderId = null;
let currentCustomer = null;
let currentPaymentMethod = null;

//Get dropdown elements
function getCustomerDropdownElements() {
    const billingInfo = document.querySelector('.billing-info');
    const inputGroups = billingInfo.querySelectorAll('.input-group');

    //First input group is customer dropdown
    const customerGroup = inputGroups[0];
    const customerInput = customerGroup.querySelector('input');
    const customerButton = customerGroup.querySelector('.dropdown-toggle');
    const customerDropdown = customerGroup.querySelector('.dropdown-menu');

    return { customerInput, customerButton, customerDropdown };
}

function getPaymentDropdownElements() {
    const paymentInfo = document.querySelector('.payment-info');
    const inputGroup = paymentInfo.querySelector('.input-group');

    const paymentInput = inputGroup.querySelector('input');
    const paymentButton = inputGroup.querySelector('.dropdown-toggle');
    const paymentDropdown = inputGroup.querySelector('.dropdown-menu');

    return { paymentInput, paymentButton, paymentDropdown };
}

//Load customer dropdown with saved customers
function populateCustomerDropdown() {
    console.log('Populating customer dropdown, customer_db:', customer_db);

    const { customerInput, customerDropdown } = getCustomerDropdownElements();

    if (!customerDropdown) {
        console.error('Customer dropdown not found!');
        return;
    }

    customerDropdown.innerHTML = '';

    // //Walk-in Customer option
    // const walkInLi = document.createElement('li');
    // walkInLi.innerHTML = `<a class="dropdown-item" href="#" data-customer-id="walk-in">Walk-in Customer</a>`;
    // customerDropdown.appendChild(walkInLi);

    if (customer_db.length === 0) {
        console.log('No saved customers in database');
    } else {
        //Add all saved customers
        customer_db.forEach(customer => {
            const li = document.createElement('li');
            li.innerHTML = `<a class="dropdown-item" href="#" data-customer-id="${customer.id}">${customer.name}</a>`;
            customerDropdown.appendChild(li);
        });
    }

    //Click handlers to dropdown items
    customerDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const customerName = this.textContent;
            const customerId = this.getAttribute('data-customer-id');

            customerInput.value = customerName;
            currentCustomer = { id: customerId, name: customerName };

            console.log('Selected customer:', currentCustomer);
        });
    });

    console.log('Customer dropdown populated with', customerDropdown.children.length, 'items');
}

//Payment method dropdown handler
function setupPaymentDropdown() {
    const { paymentInput, paymentDropdown } = getPaymentDropdownElements();

    if (!paymentDropdown) {
        console.error('Payment dropdown not found!');
        return;
    }

    paymentDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            currentPaymentMethod = this.textContent;
            paymentInput.value = currentPaymentMethod;
            console.log('Selected payment method:', currentPaymentMethod);
        });
    });
}

//Generate new order ID
function generateOrderId() {
    if (order_db.length === 0) {
        return '001';
    }
    const lastId = parseInt(order_db[order_db.length - 1].orderId);
    return String(lastId + 1).padStart(3, '0');
}

//Update checkout ui
export function updateCheckout(subtotal, discount, tax, total) {
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('discount').textContent = `$${discount.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

//Initialize order
function initializeOrder() {
    currentOrderId = generateOrderId();
    document.getElementById('order-id').textContent = currentOrderId;

    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    document.getElementById('order-date').textContent = formattedDate;
}

//Export current order ID for use in OrderDetailController
export function getCurrentOrderId() {
    return currentOrderId;
}

//Complete Order button
function setupCompleteOrderButton() {
    const completeBtn = document.querySelector('#checkout .btn-success');

    if (!completeBtn) {
        console.error('Complete order button not found!');
        return;
    }

    completeBtn.addEventListener('click', function() {
        if (!currentCustomer) {
            alert('Please select a customer!');
            return;
        }

        if (!currentPaymentMethod) {
            alert('Please select a payment method!');
            return;
        }

        const subtotalText = document.getElementById('subtotal').textContent.replace('$', '').replace('Rs. ', '');
        const subtotal = parseFloat(subtotalText);

        if (subtotal === 0 || isNaN(subtotal)) {
            alert('Please add items to the order!');
            return;
        }

        const discountText = document.getElementById('discount').textContent.replace('$', '').replace('Rs. ', '');
        const taxText = document.getElementById('tax').textContent.replace('$', '').replace('Rs. ', '');
        const totalText = document.getElementById('total').textContent.replace('$', '').replace('Rs. ', '');

        const discount = parseFloat(discountText);
        const tax = parseFloat(taxText);
        const total = parseFloat(totalText);
        const orderDate = document.getElementById('order-date').textContent;

        //Create new order
        const newOrder = new OrderModel(
            currentOrderId,
            currentCustomer.id,
            currentCustomer.name,
            orderDate,
            currentPaymentMethod,
            subtotal,
            discount,
            tax,
            total,
            'Completed'
        );

        order_db.push(newOrder);
        alert(`Order ${currentOrderId} completed successfully!`);

        console.log('Order saved:', newOrder);
        console.log('Order DB:', order_db);

        //Load recent orders table
        loadRecentOrders();

        //Clear order and reset
        clearOrder();
    });
}

//Clear Order button
function setupClearOrderButton() {
    const clearBtn = document.querySelector('#checkout .btn-outline-light');

    if (!clearBtn) {
        console.error('Clear order button not found!');
        return;
    }

    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear this order?')) {
            clearOrder();
        }
    });
}

function clearOrder() {
    const { customerInput } = getCustomerDropdownElements();
    const { paymentInput } = getPaymentDropdownElements();

    //Clear customer and payment
    customerInput.value = '';
    paymentInput.value = '';
    currentCustomer = null;
    currentPaymentMethod = null;

    //Reset checkout values
    updateCheckout(0, 0, 0, 0);

    //Clear order details table
    const event = new CustomEvent('clearOrderDetails');
    document.dispatchEvent(event);

    //Initialize new order
    initializeOrder();
}

//Load recent orders table
function loadRecentOrders() {
    const recentOrdersSection = document.querySelectorAll('.order-details-section')[1];

    if (!recentOrdersSection) {
        console.error('Recent orders section not found!');
        return;
    }

    const tbody = recentOrdersSection.querySelector('tbody');
    tbody.innerHTML = '';

    if (order_db.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders yet</td></tr>';
        return;
    }

    //Show last 10 orders (most recent first)
    const recentOrders = order_db.slice(-10).reverse();

    recentOrders.forEach(order => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.orderDate}</td>
            <td>${order.paymentMethod}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="badge bg-success">${order.status}</span></td>
        `;
    });
}

//Initialize on page load
console.log('OrderController loading');
console.log('Customer DB at init:', customer_db);

//Wait for DOM to be ready
setTimeout(() => {
    setupPaymentDropdown();
    setupCompleteOrderButton();
    setupClearOrderButton();
    populateCustomerDropdown();
    initializeOrder();
    loadRecentOrders();
    console.log('OrderController initialized');
}, 500);

//Also repopulate when orders section becomes visible
const ordersNav = document.getElementById('orders-nav');
if (ordersNav) {
    ordersNav.addEventListener('click', function() {
        console.log('Orders nav clicked');
        console.log('Customer DB:', customer_db);
        setTimeout(() => {
            populateCustomerDropdown();
            console.log('Customer dropdown repopulated');
        }, 100);
    });
} else {
    console.error('orders-nav element not found!');
}

console.log('OrderController setup complete');