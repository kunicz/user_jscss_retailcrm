import RootClass from '@helpers/root_class';
import { RESERVED_ARTIKULS, ARTIKUL_DONAT } from '@root/config';
import Order from '@pages/order';
import ProductsRows from '@modules/order/products/rows';

export default class PrintCard extends RootClass {
	constructor() {
		super();
		this.products = null;
		this.printable = [];
	}

	async init() {
		this.products = ProductsRows.products();
		if (!this.products.length) return;

		this.products.forEach(product => {
			const card = product.properties.items.find(i => i.name === 'выебри карточку')?.value;
			const sku = product.properties.items.find(i => i.name === 'артикул')?.value;
			const artikul = sku?.split('-')[0];
			const value = RESERVED_ARTIKULS.includes(artikul) ? sku : artikul;
			if (!card || !sku || !artikul) return;

			this.printable.push({ product, card, value });
		});

		this.addPrintableButtons();
	}

	// добавляет кнопки для печати карточек
	addPrintableButtons() {
		if (!this.needPrint()) return;

		const $origBtn = $('a[href$="print/16"]');
		$origBtn.hide();

		this.printable.forEach(item => {
			const url = `https://php.2steblya.ru/print_card?order_id=${Order.getId()}&sku=${item.value}&shop_crm_id=${Order.getShop().id}`;
			const $btn = $(`<li><a href="${url}" target="_blank">${item.product.title}</a></li>`);
			$btn.appendTo($origBtn.parents('ul').get(0));
		});
	}

	// проверяет, нужно ли печатать карточки
	needPrint() {
		if (!this.printable.length) return false;
		if (this.printable.every(item => item.value == ARTIKUL_DONAT)) return false;
		return true;
	}
}
