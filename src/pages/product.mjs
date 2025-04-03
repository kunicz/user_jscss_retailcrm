import ProductEditable from '@modules/product/editable';

export default class Product {
	static moduleName = 'product';

	init() {
		new ProductEditable().init();
	}
}