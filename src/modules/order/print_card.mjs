import { RESERVED_SKUS, SKU_DONAT } from '@root/config';
import Order from '@pages/order';
import ProductsRows from '@modules/order/products/rows';

export default class PrintCard {
	constructor() {
		this.products = null;
		this.printable = [];
	}

	async init() {
		this.products = ProductsRows.products();
		if (!this.products.length) return;

		this.products.forEach(product => {
			const card = product.properties.items.find(i => i.name === 'выебри карточку')?.value;
			const artikul = product.properties.items.find(i => i.name === 'артикул')?.value;
			const sku = this.getSku(artikul);
			if (!card || !sku) return;

			this.printable.push({ product, card, sku });
		});

		this.addPrintableButtons();
	}

	destroy() {
		this.products = null;
		this.printable = null;
	}

	// добавляет кнопки для печати карточек
	addPrintableButtons() {
		if (!this.needPrint()) return;

		const $origBtn = $('a[href$="print/16"]');
		$origBtn.hide();

		this.printable.forEach(item => {
			const url = `https://php.2steblya.ru/print_card?order_id=${Order.getId()}&sku=${item.sku}&shop_crm_id=${Order.getShop().id}`;
			const $btn = $(`<li><a href="${url}" target="_blank">${item.product.title}</a></li>`);
			$btn.appendTo($origBtn.parents('ul').get(0));
		});
	}

	// возвращает SKU
	getSku(artikul) {
		if (!artikul) return null;
		const probableSku = parseInt(artikul.match(/^(\d+)/)?.[1]);
		return RESERVED_SKUS.includes(probableSku) ? artikul : probableSku;
	}

	// проверяет, нужно ли печатать карточки
	needPrint() {
		if (!this.printable.length) return false;
		if (this.printable.every(item => item.sku == SKU_DONAT)) return false;
		return true;
	}
}
