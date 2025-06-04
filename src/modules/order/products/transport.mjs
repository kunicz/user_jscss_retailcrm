import RootClass from '@helpers/root_class';
import Order from '@pages/order';
import ProductsRows from '@modules/order/products/rows';
import wait from '@helpers/wait';
import { php2steblya } from '@helpers/api';

export default class Transport extends RootClass {
	async init() {
		this.observer = this.setObserver();
		const products = await ProductsRows.products();
		this.product = products.find(p => p.isTransport) || null;
		!this.product ? this.add() : this.update();
	}

	// добавляет транспортировочное
	async add() {
		const skip = await this.shouldSkip();
		if (skip) return;

		try {
			this.observer.stop();
			this.toggleFreeze(true);
			this.saveOrder();
			await wait.sec();
			await php2steblya('retailcrm/AddTransport').get({ id: Order.getId() });
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
	async shouldSkip() {
		// проверяем наличие каталожных сборных товаров
		const products = await ProductsRows.products();
		if (!products.some(p => p.isCatalog)) return true;

		// проверяем что есть не только допники/донаты
		if (!products.some(p => !p.isDopnik && !p.isDonat)) return true;

		// проверяем назначен ли флорист
		if (!$(`#${Order.intaro}_customFields_florist`).val()) return true;

		return false;
	}

	// сохраняет заказ
	saveOrder() {
		$('#main button[type="submit"]').trigger('click');
	}

	// замораживает/размораживает сайт
	toggleFreeze(toggle = true) {
		$('body').css('opacity', toggle ? .2 : 1).attr('disabled', toggle);
	}
}
