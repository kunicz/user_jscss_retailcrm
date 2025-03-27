import { Order } from '@pages/order';
import { ProductsRows as Products } from '@modules/order/products/rows';
import wait from '@helpers/wait';
import { php2steblya } from '@helpers/api';

export default class Transport {
	constructor({ product = null, watcher = null }) {
		this.product = product;
		this.watcher = watcher;
	}

	async init() {
		this.equalPrices();
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
			await this.prepareForTransportAdd();
			await php2steblya('retailcrm/AddTransport').get({ id: Order.id });
			window.location.reload();
		} catch (error) {
			console.error('Ошибка добавления транспортировочного:', error);
			this.toggleFreeze(false);
			this.watcher.start();
		}
	}


	// проверяет, нужно ли добавлять транспортировочное
	shouldSkip() {
		// проверяем наличие товаров с картинкой
		if (!Products.$table().find('.catalog').length) return true;

		// проверяем что есть не только допники/донаты
		const catalogItems = Products.$table().find('.catalog').length;
		const dopnikItems = Products.$table().find('.dopnik').length;
		const donatItems = Products.$table().find('.donat').length;
		if (catalogItems === dopnikItems + donatItems) return true;

		// проверяем назначен ли флорист
		if (!$(`#${Order.intaro}_customFields_florist`).val()) return true;

		return false;
	}

	// подготавливает сайт к добавлению транспортировочного
	async prepareForTransportAdd() {
		this.saveOrder();
		this.watcher.stop();
		await wait.sec();
		this.toggleFreeze(true);
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
