export default class OrderModel {
    constructor(orderId, customerId, customerName, orderDate, paymentMethod, subtotal, discount, tax, total, status = 'Completed') {
        this.orderId = orderId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.orderDate = orderDate;
        this.paymentMethod = paymentMethod;
        this.subtotal = subtotal;
        this.discount = discount;
        this.tax = tax;
        this.total = total;
        this.status = status;
    }
}