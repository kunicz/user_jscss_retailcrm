import ensure from '@helpers/ensure';
import is from '@helpers/is';
import ProductsData from '@modules/order/products_data/builder';
import ProductsRows from '@modules/order/products/rows';

export default class ProductsDataRefresher {
	// Обновляет указанные поля у переданных DOM-нод с продуктами
	static refresh(fields, nodes) {
		fields = this.ensureFields(fields);
		nodes = this.ensureNodes(nodes);
		const getMethods = this.getMethods();

		for (const node of nodes) {
			const $product = $(node);
			const productData = $product?.data('product');

			if (!productData || !$product.length) continue;

			for (const field of fields) {
				const getMethod = getMethods['get' + field.charAt(0).toUpperCase() + field.slice(1)];
				if (typeof getMethod === 'function') {
					productData[field] = getMethod($product);
				}
			}

			$product.data('product', productData);
		}
	}

	// Гарантирует массив строк (имён полей)
	static ensureFields(fields) {
		if (is.string(fields)) return [fields];
		if (is.array(fields)) return fields.map(f => ensure.string(f));
		if (!fields) return Object.keys(this.getMethods());
		return [];
	}

	// Гарантирует массив DOM-нод
	static ensureNodes(nodes) {
		if (is.string(nodes)) return [ensure.node(nodes)];
		if (is.array(nodes)) return nodes.map(p => ensure.node(p));
		if (!nodes) return ProductsRows.$get(); // теперь источник нод — ProductsRows
		return [];
	}

	// Собирает методы ProductsData, начинающиеся с "get"
	static getMethods() {
		const methods = {};
		for (const key of Object.getOwnPropertyNames(ProductsData)) {
			const fn = ProductsData[key];
			if (typeof fn === 'function' && key.startsWith('get') && key !== 'get') {
				methods[key] = fn;
			}
		}
		return methods;
	}
}
