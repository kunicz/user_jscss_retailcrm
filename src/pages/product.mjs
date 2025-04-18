import ProductEditable from '@modules/product/editable';

export default class Product {
	static name = 'product';

	constructor() {
		this.editable = new ProductEditable();
	}

	init() {
		this.editable.init();
	}

	destroy() {
		this.editable.destroy();
	}
}