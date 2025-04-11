import Order from '@pages/order';
import ProductsRows from '@modules/order/products/rows';
import wait from '@helpers/wait';
import { php2steblya } from '@helpers/api';
import observers from '@helpers/observers';

export default class Transport {
	constructor() {
		this.product = null;
		this.observer = observers.order.get('products-rows');
	}

	async init() {
		this.product = ProductsRows.get().find(p => p.isTransport);
		!this.product ? this.add() : this.equalPrices();
	}

	// цена закупа и реализации всегда равны
	async equalPrices() {
		if (this.product.price === this.product.purchasePrice && this.product.price > 0) return;
		this.product.$.find('.purchase-price .wholesale-price__input').val(this.product.price).change();
		this.product.$.find('.purchase-price .wholesale-price__btn-done').trigger('click');
	}

	// добавляет транспортировочное
	async add() {
		if (this.shouldSkip()) return;
		try {
			this.observer.stop();
			this.saveOrder();
			this.toggleFreeze(true);
			await php2steblya('retailcrm/AddTransport').get({ id: Order.getId() });
			console.log('Транспортировочное добавлено');
			window.location.reload();
		} catch (error) {
			console.error('Ошибка добавления транспортировочного:', error);
			this.toggleFreeze(false);
			this.observer.start();
		}
	}


	// проверяет, нужно ли добавлять транспортировочное
	shouldSkip() {
		// проверяем наличие товаров с картинкой
		if (!ProductsRows.get().some(p => p.isCatalog)) return true;

		// проверяем что есть не только допники/донаты
		const catalogItems = ProductsRows.get().filter(p => p.isCatalog).length;
		const dopnikItems = ProductsRows.get().filter(p => p.isDopnik).length;
		const donatItems = ProductsRows.get().filter(p => p.isDonat).length;
		if (catalogItems === dopnikItems + donatItems) return true;

		// проверяем назначен ли флорист
		if (!$(`#${Order.intaro}_customFields_florist`).val()) return true;

		return false;
	}

	// сохраняет заказ
	async saveOrder() {
		$('#main button[type="submit"]').trigger('click');
		await wait.sec();
	}

	// замораживает/размораживает сайт
	toggleFreeze(toggle = true) {
		$('body').css('opacity', toggle ? .2 : 1).attr('disabled', toggle);
	}
}
