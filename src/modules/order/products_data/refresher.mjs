import ensure from '@helpers/ensure';
import is from '@helpers/is';
import { ProductsData } from '@modules/order/products_data/data';

export class ProductsDataRefresher {
	// обновляет данные по товарам
	static refresh(fields, nodes) {
		fields = self.ensureFields(fields);
		nodes = self.ensureNodes(nodes);
		const getMethods = self.getMethods();

		for (const node of nodes) {
			const product = ProductsData.data.get(node);
			if (!product || !product.$) continue;

			for (const field of fields) {
				const getMethod = getMethods?.['get' + field.charAt(0).toUpperCase() + field.slice(1)];
				if (!getMethod) continue;
				product[field] = getMethod(product.$);
			}
		}
	}

	// всегда массив строк
	static ensureFields(fields) {
		if (is.string(fields)) return [fields];
		if (is.array(fields)) return fields.map(f => ensure.string(f));
		if (!fields) return Object.keys(self.getMethods());
	}

	//всегда массив нод
	static ensureNodes(nodes) {
		if (is.string(nodes)) return [ensure.node(nodes)];
		if (is.array(nodes)) return nodes.map(p => ensure.node(p));
		if (!nodes) return [...ProductsData.data.keys()];
	}

	// список методов для обновления
	static getMethods() {
		const methods = {}
		for (const key of Object.getOwnPropertyNames(ProductsData)) {
			if (typeof ProductsData[key] !== 'function') continue;
			if (!key.startsWith('get') || key === 'get') continue;
			methods[key] = ProductsData[key];
		}
		return methods;
	}
}

const self = ProductsDataRefresher;
