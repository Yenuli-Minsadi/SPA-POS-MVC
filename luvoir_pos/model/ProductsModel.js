export default class ProductsModel {
    constructor( id, description, price, quantity, category, image) {
        this.id = id;
        this.description = description;
        this.price = price;
        this.quantity = quantity;
        this.category = category;
        this.image = image;
    }
}