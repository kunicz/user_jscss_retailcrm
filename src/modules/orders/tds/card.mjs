import * as cols from '@modules/orders/cols';
import copyBtn from '@helpers/clipboard';
import { inlineTooltip } from '@src/helpers';
import OrderTd from '@modules/orders/td';
import { SKU_DONAT, SKU_TRANSPORT } from '@root/config';

export default class CardTd extends OrderTd {
	static columnName = 'card';

	constructor(row) {
		super(row);
		this.products = this.orderCrm?.items;
		this.customText = this.row.get(cols.cardText);
		this.skus = [];
		this.artikuls = [];
		this.getSkusAndArtikuls();
		this.types = this.getTypes();
		this.text = this.getText();
	}

	init() {
		this.$native.text(this.text);
		this.textCustom();
		this.noIdentic();
		this.printCard();
	}

	// помечает заказ без айдентики
	noIdentic() {
		if (this.text != 'без айдентики') return;
		this.$td.addClass('noIdentic');
	}

	// + свой текст
	textCustom() {
		if (!this.customText) return;

		if (this.text !== 'со своим текстом') this.$td.addClass('addComment customCardText');
		const $copyBtn = copyBtn(this.customText);
		$copyBtn.appendTo(this.$td);
		inlineTooltip($copyBtn, this.customText);
	}

	// ссылка на печать карточки
	printCard() {
		if (!this.text || this.text === 'без карточки') return;
		if (this.text === 'без айдентики' && !this.customText) return;
		if (this.skus.length !== 1) return;
		if ([SKU_DONAT, SKU_TRANSPORT].includes(this.skus[0])) return;
		$(`<a class="print_card" href="https://php.2steblya.ru/print_card?order_id=${this.orderCrm.id}&sku=${this.artikuls[0]}&shop_crm_id=${this.row.shopDb?.shop_crm_id}" target="_blank">⎙</a>`).appendTo(this.$td);
	}

	// получает sku и артикулы всех реальных товаров в заказе
	getSkusAndArtikuls() {
		const skuSet = new Set();
		const artikulSet = new Set();

		this.products.forEach(p => {
			const artikul = p.offer?.article;
			if (!artikul) return;

			const sku = artikul.split('-')[0];
			if (sku === SKU_TRANSPORT) return;

			skuSet.add(sku);
			artikulSet.add(artikul);
		});

		this.skus = [...skuSet];
		this.artikuls = [...artikulSet];
	}

	// получаем типы карточек для всех товаров в заказе
	getTypes() {
		return [...new Set(
			this.products
				.map(p => p.properties?.['viebri-kartochku']?.value)
				.filter(Boolean)
		)];
	}

	// получаем текст в ячейку
	getText() {
		switch (this.types.length) {
			case 0:
				if (this.customText) return 'со своим текстом';
				if (this.skus[0] == SKU_DONAT) return '';
				return 'без карточки';
			case 1:
				if (this.types[0] === 'без карточки' && this.customText) return 'со своим текстом';
				return this.types[0];
			default:
				return 'разные';
		}
	}
}