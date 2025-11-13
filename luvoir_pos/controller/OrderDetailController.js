import OrderDetailModel from '../model/OrderDetailModel.js';
import { product_db } from '../db/db.js';
import { updateCheckout, getCurrentOrderId } from './OrderController.js';

let orderDetails = [];
const TAX_RATE = 0.08; // 8% tax

//Get product dropdown elements
function getProductDropdownElements() {
    const billingInfo = document.querySelector('.billing-info');
    const inputGroups = billingInfo.querySelectorAll('.input-group');

    //Second input group is product dropdown
    const productGroup = inputGroups[1];
    const productInput = productGroup.querySelector('input');
    const productButton = productGroup.querySelector('.dropdown-toggle');
    const productDropdown = productGroup.querySelector('.dropdown-menu');

    return { productInput, productButton, productDropdown };
}

//Get quantity input
function getQuantityInput() {
    const billingInfo = document.querySelector('.billing-info');
    const inputGroups = billingInfo.querySelectorAll('.input-group');

    //Third input group is quantity
    const qtyGroup = inputGroups[2];
    return qtyGroup.querySelector('input[placeholder="Qty..."]');
}

let selectedProduct = null;

//load product dropdown with saved products
function populateProductDropdown() {
    console.log('Populating product dropdown...');
    console.log('product_db:', product_db);
    console.log('product_db length:', product_db.length);

    const { productInput, productDropdown } = getProductDropdownElements();

    if (!productDropdown) {
        console.error('Product dropdown not found!');
        return;
    }

    productDropdown.innerHTML = '';

    if (product_db.length === 0) {
        const li = document.createElement('li');
        li.innerHTML = `<a class="dropdown-item" href="#">No products available</a>`;
        productDropdown.appendChild(li);
        console.log('No products in database');
        return;
    }

    let hasStock = false;

    //Add all products with stock
    product_db.forEach(product => {
        console.log('Product:', product, 'Quantity:', product.quantity);
        if (product.quantity > 0) { // Only show products with stock
            hasStock = true;
            const li = document.createElement('li');
            li.innerHTML = `<a class="dropdown-item" href="#" data-product-id="${product.id}">
                ${product.description} - Rs. ${product.price.toFixed(2)} (Stock: ${product.quantity})
            </a>`;
            productDropdown.appendChild(li);
        }
    });

    //If no products have stock
    if (!hasStock) {
        const li = document.createElement('li');
        li.innerHTML = `<a class="dropdown-item" href="#">All products out of stock</a>`;
        productDropdown.appendChild(li);
        console.log('All products out of stock');
    }

    //Click handlers to dropdown items
    productDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');

            if (productId) {
                selectedProduct = product_db.find(p => p.id === productId);

                if (selectedProduct) {
                    productInput.value = selectedProduct.description;
                    console.log('Selected product:', selectedProduct);
                }
            }
        });
    });

    console.log('Product dropdown populated with', productDropdown.children.length, 'items');
}

//Add to cart button
function setupAddToCartButton() {
    const addToCartBtn = document.querySelector('.btn-add-product');

    if (!addToCartBtn) {
        console.error('Add to cart button not found!');
        return;
    }

    addToCartBtn.addEventListener('click', function() {
        console.log('Add to Cart clicked');

        const { productInput } = getProductDropdownElements();
        const qtyInput = getQuantityInput();

        if (!selectedProduct) {
            alert('Please select a product!');
            return;
        }

        const quantity = parseInt(qtyInput.value);

        if (!quantity || quantity <= 0) {
            alert('Please enter a valid quantity!');
            return;
        }

        if (quantity > selectedProduct.quantity) {
            alert(`Only ${selectedProduct.quantity} units available in stock!`);
            return;
        }

        //Get current order ID
        const orderId = getCurrentOrderId();

        //Check if product exists in order
        const existingDetail = orderDetails.find(d => d.productId === selectedProduct.id);

        if (existingDetail) {
            // Update quantity
            const newQuantity = existingDetail.quantity + quantity;

            if (newQuantity > selectedProduct.quantity) {
                alert(`Cannot add more. Only ${selectedProduct.quantity} units available!`);
                return;
            }

            existingDetail.quantity = newQuantity;
            existingDetail.total = existingDetail.unitPrice * newQuantity;
        } else {
            // Add new item
            const total = selectedProduct.price * quantity;
            const newDetail = new OrderDetailModel(
                orderId,
                selectedProduct.id,
                selectedProduct.description,
                selectedProduct.price,
                quantity,
                total
            );
            orderDetails.push(newDetail);
        }

        //Update product quantity in stock
        selectedProduct.quantity -= quantity;

        console.log('Order details:', orderDetails);
        console.log('Updated product stock:', selectedProduct);

        // Clear inputs
        productInput.value = '';
        qtyInput.value = '';
        selectedProduct = null;

        //Refresh
        loadOrderDetailsTable();
        calculateCheckout();
        populateProductDropdown(); // Refresh dropdown with updated stock
    });
}

//Load order details table
function loadOrderDetailsTable() {
    const orderDetailsSection = document.querySelectorAll('.order-details-section')[0];

    if (!orderDetailsSection) {
        console.error('Order details section not found!');
        return;
    }

    const tbody = orderDetailsSection.querySelector('#order-items');

    if (!tbody) {
        console.error('Order items tbody not found!');
        return;
    }

    tbody.innerHTML = '';

    if (orderDetails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No items added yet</td></tr>';
        return;
    }

    orderDetails.forEach((detail, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${detail.productName}</td>
            <td>Rs. ${detail.unitPrice.toFixed(2)}</td>
            <td>${detail.quantity}</td>
            <td>Rs. ${detail.total.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" data-product-id="${detail.productId}">
                    Remove
                </button>
            </td>
        `;

        //Add remove button handler
        const removeBtn = row.querySelector('.btn-danger');
        removeBtn.addEventListener('click', function() {
            removeOrderItem(this.getAttribute('data-product-id'));
        });
    });
}

//Remove item from order
function removeOrderItem(productId) {
    const detail = orderDetails.find(d => d.productId === productId);

    if (!detail) return;

    if (confirm(`Remove ${detail.productName} from order?`)) {
        // Return quantity to stock
        const product = product_db.find(p => p.id === productId);
        if (product) {
            product.quantity += detail.quantity;
            console.log('Returned stock:', product);
        }

        // Remove from order details
        orderDetails = orderDetails.filter(d => d.productId !== productId);

        console.log('Removed item, remaining details:', orderDetails);

        // Refresh displays
        loadOrderDetailsTable();
        calculateCheckout();
        populateProductDropdown(); // Refresh dropdown with updated stock
    }
}

//Calculate checkout totals
function calculateCheckout() {
    const subtotal = orderDetails.reduce((sum, detail) => sum + detail.total, 0);
    const discount = 0; // Can be implemented later
    const tax = subtotal * TAX_RATE;
    const total = subtotal - discount + tax;

    console.log('Checkout calculated:', { subtotal, discount, tax, total });

    updateCheckout(subtotal, discount, tax, total);
}

//Clear order details (called from OrderController)
document.addEventListener('clearOrderDetails', function() {
    console.log('Clearing order details...');

    //Return all quantities to stock
    orderDetails.forEach(detail => {
        const product = product_db.find(p => p.id === detail.productId);
        if (product) {
            product.quantity += detail.quantity;
        }
    });

    orderDetails = [];
    loadOrderDetailsTable();
    calculateCheckout();
    populateProductDropdown(); // Refresh dropdown

    console.log('Order details cleared');
});

//Initialize
console.log('OrderDetailController loading');
console.log('product_db at load:', product_db);
console.log('Number of products:', product_db.length);

//Setup button and initial load
setTimeout(() => {
    setupAddToCartButton();
    loadOrderDetailsTable();
    console.log('OrderDetailController initialized');
}, 500);

//Load when orders section becomes visible
const ordersNav = document.getElementById('orders-nav');
if (ordersNav) {
    ordersNav.addEventListener('click', function() {
        console.log('Orders nav clicked');
        console.log('product_db:', product_db);
        console.log('Number of products:', product_db.length);

        if (product_db.length > 0) {
            console.log('Products found:');
            product_db.forEach((p, i) => {
                console.log(`  ${i + 1}. ${p.description} - Qty: ${p.quantity} - Price: ${p.price}`);
            });
        } else {
            console.log('NO PRODUCTS FOUND!');
        }

        //Small delay to ensure section is visible
        setTimeout(() => {
            populateProductDropdown();
            console.log('Product dropdown repopulated');
        }, 100);
    });
} else {
    console.error('orders-nav element not found!');
}

console.log('OrderDetailController setup complete');