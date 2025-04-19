import Transport from '@modules/order/products/transport';
import ProductsTable from '@modules/order/products/table';
import ProductsRow from '@modules/order/products/row';
import observers from '@helpers/observers';
import wait from '@helpers/wait';

export default class ProductsRows {
	constructor() {
		this.observer = observers.add('order', 'products-rows');
		this.transport = new Transport();
		this.rows = new Map();
	}

	async init() {
		this.listen();
		self.$trs().toArray().forEach(tr => this.row(tr));
		this.transport.init();
		this.sort();
	}

	destroy() {
		this.observer = null;
		this.transport.destroy();
		for (const row of this.rows.values()) row.destroy();
		this.rows = null;
	}

	// слушает изменения в таблице (добавление/удаление товаров)
	listen() {
		this.observer
			.setTarget(self.$table())
			.setSelector('tbody')
			.onAdded(tbody => {
				this.row(tbody.querySelector('tr'));
				this.transport.init();
				this.sort();
			})
			.onRemoved(tbody => {
				const tr = tbody.tr;
				this.rows.get(tr).destroy();
				this.rows.delete(tr);
				this.transport.init();
				this.sort();
			})
			.start();
	}

	// создаёт и инициализирует строку товара
	row(tr) {
		const row = new ProductsRow(tr);
		this.rows.set(tr, row);
		row.init();
	}

	// сортирует товары по алфавиту
	async sort() {
		this.observer.stop();

		// Создаём временные массивы для каждой группы товаров
		const catalogProducts = [];
		const dopnikProducts = [];
		const otherProducts = [];

		// Распределяем товары по группам
		const products = await self.products();
		products.forEach(product => {
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
	// важно дождаться загрузки всех товаров перед вызовом
	static async products() {
		const $trs = self.$trs();
		let products = [];

		const waitData = await wait.check(() => {
			products = $trs.toArray().map(tr => $(tr).data('product')).filter(Boolean);
			return $trs.length === products.length;
		});

		if (!waitData) throw new Error('Не удалось получить данные всех товаров');
		return products;
	}
}

const self = ProductsRows;