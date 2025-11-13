export default class OrderDetailModel {
    constructor(orderId, productId, productName, unitPrice, quantity, total) {
        this.orderId = orderId;
        this.productId = productId;
        this.productName = productName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.total = total;
    }
}