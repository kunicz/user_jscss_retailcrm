import * as cols from '@modules/orders/cols';
import copyBtn from '@helpers/clipboard';
import { inlineTooltip } from '@src/helpers';
import OrderTd from '@modules/orders/td';
import { ARTIKUL_DONAT, ARTIKUL_TRANSPORT, RESERVED_ARTIKULS } from '@root/config';

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
		if ([ARTIKUL_DONAT, ARTIKUL_TRANSPORT].includes(this.artikuls[0])) return;
		const sku = RESERVED_ARTIKULS.includes(this.artikuls[0]) ? this.skus[0] : this.artikuls[0];
		$(`<a class="print_card" href="https://php.2steblya.ru/print_card?order_id=${this.orderCrm.id}&sku=${sku}&shop_crm_id=${this.row.shopDb?.shop_crm_id}" target="_blank">⎙</a>`).appendTo(this.$td);
	}

	// получает sku и артикулы всех реальных
	getSkusAndArtikuls() {
		const skuSet = new Set();
		const artikulSet = new Set();

		this.products.forEach(p => {
			const sku = p.offer?.article;
			if (!sku) return;

			const artikul = sku.split('-')[0];
			if (artikul === ARTIKUL_TRANSPORT) return;

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
				if (this.artikuls[0] == ARTIKUL_DONAT) return '';
				return 'без карточки';
			case 1:
				if (this.types[0] === 'без карточки' && this.customText) return 'со своим текстом';
				return this.types[0];
			default:
				return 'разные';
		}
	}
}