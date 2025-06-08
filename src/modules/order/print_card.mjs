import RootClass from '@helpers/root_class';
import { RESERVED_ARTIKULS, ARTIKUL_DONAT } from '@root/config';
import { intaro } from '@modules/order/sections';
import dom from '@helpers/dom';

export default class PrintCard extends RootClass {
	constructor() {
		super();
		this.trs = dom.all('tr[id^="order-product-section"]');
		this.crm = dom('#main').data('crm');
		this.printable = [];
	}

	async init() {
		if (!this.trs.length) return;

		this.trs.forEach(tr => {
			const title = tr.getTitle();
			const sku = tr.getProperties().find(i => i.name === 'артикул')?.value;
			const artikul = sku?.split('-')[0];
			const value = RESERVED_ARTIKULS.includes(artikul) ? sku : artikul;
			if (!sku || !artikul) return;

			this.printable.push({ title, value });
		});

		this.addPrintableButtons();
		return this;
	}

	// добавляет кнопки для печати карточек
	addPrintableButtons() {
		if (!this.needPrint()) return;

		const origBtn = dom('a[href$="print/16"]');
		origBtn.hide();

		this.printable.forEach(item => {
			const title = item.title;
			const artikul = item.value;
			const order_id = this.crm.id;
			const shop_crm_id = dom(`#${intaro}_site`).val();
			const url = `https://php.2steblya.ru/print_card?order_id=${order_id}&sku=${artikul}&shop_crm_id=${shop_crm_id}`;
			const btn = dom(`<li><a href="${url}" target="_blank">${title}</a></li>`);
			btn.lastTo(origBtn.ancestor('ul'));
		});
	}

	// проверяет, нужно ли печатать карточки
	needPrint() {
		if (!this.printable.length) return false;
		if (this.printable.every(item => item.value == ARTIKUL_DONAT)) return false;
		return true;
	}
}