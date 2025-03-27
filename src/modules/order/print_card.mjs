import { RESERVED_SKUS, SKU_DONAT } from '@root/config';

export default (order) => new PrintCard(order).init();

class PrintCard {
	constructor(order) {
		this.order = order;
		this.product = $('#order-products-table .catalog:first');
		this.card = this.product.find('[title^="выебри карточку:"]');
		this.artikul = this.product.find('[title^="артикул:"]')?.attr('title')?.replace('артикул: ', '');
		this.sku = this.getSku();
		this.$btn = $('li.print [href$="print/16"]');
	}

	init() {
		this.modifyPrintButton();
	}

	modifyPrintButton() {
		if (!this.needPrint()) return;
		this.$btn.attr('href', `https://php.2steblya.ru/print_card?order_id=${this.order.id}&sku=${this.sku}&shop_crm_id=${this.order.shop.crmId}`);
	}

	getSku() {
		if (!this.artikul) return null;
		const probableSku = parseInt(this.artikul.match(/^(\d+)/)?.[1]);
		return RESERVED_SKUS.includes(probableSku) ? this.artikul : probableSku;
	}

	needPrint() {
		return (!this.card || !this.sku || this.sku == SKU_DONAT) ? false : true;
	}
}
