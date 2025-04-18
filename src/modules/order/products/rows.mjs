import Transport from '@modules/order/products/transport';
import ProductsTable from '@modules/order/products/table';
import ProductsRow from '@modules/order/products/row';
import observers from '@helpers/observers';

export default class ProductsRows {
	constructor() {
		this.observer = observers.add('order', 'products-rows');
		this.transport = new Transport();
		this.rows = [];
	}

	async init() {
		this.listen();
		await Promise.all(self.$trs().toArray().map(tr => {
			const row = new ProductsRow(tr);
			this.rows.push(row);
			return row.init();
		}));
		this.transport.init();
		this.sort();
	}

	destroy() {
		this.observer = null;
		this.transport.destroy();
		this.rows.forEach(row => row.destroy());
		this.rows = [];
	}

	// слушает изменения в таблице (добавление/удаление товаров)
	listen() {
		this.observer
			.setTarget(self.$table())
			.setSelector('tbody')
			.onAdded(async (tr) => {
				this.transport.init();
				await new ProductsRow(tr).init();
				this.sort();
			})
			.onRemoved(() => {
				this.transport.init();
				this.sort();
			})
			.start();
	}

	// сортирует товары по алфавиту
	sort() {
		this.observer.stop();

		// Создаём временные массивы для каждой группы товаров
		const catalogProducts = [];
		const dopnikProducts = [];
		const otherProducts = [];

		// Распределяем товары по группам
		self.products().forEach(product => {
			const item = { title: product.title, $: product.$container.detach() };

			if (product.isCatalog) {
				if (product.isDopnik) {
					dopnikProducts.push(item);
				} else {
					catalogProducts.push(item);
				}
			} else {
				otherProducts.push(item);
			}
		});

		// Сортируем каждую группу по алфавиту
		catalogProducts.sort((a, b) => a.title.localeCompare(b.title));
		dopnikProducts.sort((a, b) => a.title.localeCompare(b.title));
		otherProducts.sort((a, b) => a.title.localeCompare(b.title));

		// Добавляем обратно в таблицу в нужном порядке
		catalogProducts.forEach(item => self.$table().append(item.$));
		dopnikProducts.forEach(item => self.$table().append(item.$));
		otherProducts.forEach(item => self.$table().append(item.$));

		this.observer.start();
	}

	// возвращает таблицу товаров
	static $table() { return ProductsTable.$table(); }

	// возвращает строки товаров
	static $trs() { return self.$table().children('tbody').children('tr'); }

	// возвращает массив данных товаров
	static products() {
		return self.$trs().toArray().map(tr => $(tr).data('product'));
	}
}

const self = ProductsRows;