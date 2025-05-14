import RootClass from '@helpers/root_class';
import ProductEditable from '@modules/product/editable';

export default class Product extends RootClass {
	static name = 'product';

	constructor() {
		super();
		this.editable = new ProductEditable();
	}

	init() {
		this.editable.init();
	}
}