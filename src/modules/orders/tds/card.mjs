import OrdersTd from '@modules/orders/td';
import copyBtn from '@helpers/clipboard';
import { inlineTooltip } from '@src/helpers';
import { ARTIKUL_DONAT, ARTIKUL_TRANSPORT, RESERVED_ARTIKULS } from '@root/config';
import { shops } from '@src/mappings';
import dom from '@helpers/dom';

export default class CardTd extends OrdersTd {
	static columnName = 'card';

	constructor(td) {
		super(td);
		this.products = this.crm.items;
		this.customText = this.crm.customFields.text_v_kartochku;
		this.skus = [];
		this.artikuls = [];
		this.defineSkusAndArtikuls();
		this.productsCardTypes = this.getProductsCardTypes();
		this.cardType = this.getCardType();
	}

	init() {
		this.td.child('.native').txt(this.cardType);
		this.textCustom();
		this.noIdentic();
		this.printCard();
	}

	// помечает заказ без айдентики
	noIdentic() {
		if (this.cardType != 'без айдентики') return;
		this.td.addClass('noIdentic');
	}

	// + свой текст
	textCustom() {
		if (!this.customText) return;

		if (this.cardType !== 'со своим текстом') this.td.addClass('addComment customCardText');
		const btn = copyBtn(this.customText, '');
		btn.lastTo(this.td);
		inlineTooltip(btn, this.customText);
	}

	// ссылка на печать карточки
	printCard() {
		if (this.crm.site === 'ostatki-msk') return;
		if (!this.cardType || this.cardType === 'без карточки') return;
		if (this.cardType === 'без айдентики' && !this.customText) return;
		if (this.skus.length !== 1) return;
		if ([ARTIKUL_DONAT, ARTIKUL_TRANSPORT].includes(this.artikuls[0])) return;
		const sku = RESERVED_ARTIKULS.includes(this.artikuls[0]) ? this.skus[0] : this.artikuls[0];
		const shop_crm_id = shops.find(s => s.shop_crm_code === this.crm.site).shop_crm_id;
		const href = `https://php.2steblya.ru/print_card?order_id=${this.crm.id}&sku=${sku}&shop_crm_id=${shop_crm_id}`;
		dom(`<a class="print_card" href="${href}" target="_blank">⎙</a>`).lastTo(this.td);
	}

	// получает sku и артикулы всех реальных каталожных товаров в заказе
	defineSkusAndArtikuls() {
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
	getProductsCardTypes() {
		return [...new Set(
			this.products
				.map(p => p.properties?.['viebri-kartochku']?.value)
				.filter(Boolean)
		)];
	}

	// получаем текст в ячейку
	getCardType() {
		switch (this.productsCardTypes.length) {
			case 0:
				if (this.customText) return 'со своим текстом';
				if (this.artikuls[0] == ARTIKUL_DONAT) return '';
				return 'без карточки';
			case 1:
				if (this.productsCardTypes[0] === 'без карточки' && this.customText) return 'со своим текстом';
				return this.productsCardTypes[0];
			default:
				return 'разные';
		}
	}
}
OrdersTd.registerClass(CardTd);