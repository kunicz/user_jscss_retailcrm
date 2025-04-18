import Order from '@pages/order';
import ProductsRows from '@modules/order/products/rows';
import wait from '@helpers/wait';
import { php2steblya } from '@helpers/api';
import observers from '@helpers/observers';

export default class Transport {
	async init() {
		this.observer = observers.get('order', 'products-rows');
		this.product = ProductsRows.products().find(p => p.isTransport) || null;

		!this.product ? this.add() : this.update();
	}

	destroy() {
		this.observer = null;
		this.product = null;
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

	// обновляет транспортировочное
	update() {
		this.equalPrices();
	}

	// цена закупа и реализации всегда равны
	equalPrices() {
		if (this.product.price === this.product.purchasePrice && this.product.price > 0) return;
		this.product.$.find('.purchase-price .wholesale-price__input').val(this.product.price).change();
		this.product.$.find('.purchase-price .wholesale-price__btn-done').trigger('click');
	}

	// проверяет, нужно ли добавлять транспортировочное
	shouldSkip() {
		// проверяем наличие товаров с картинкой
		if (!ProductsRows.products().some(p => p.isCatalog)) return true;

		// проверяем что есть не только допники/донаты
		const catalogItems = ProductsRows.products().filter(p => p.isCatalog).length;
		const dopnikItems = ProductsRows.products().filter(p => p.isDopnik).length;
		const donatItems = ProductsRows.products().filter(p => p.isDonat).length;
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
