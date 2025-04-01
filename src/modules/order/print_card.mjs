import { RESERVED_SKUS, SKU_DONAT } from '@root/config';
import { Order } from '@pages/order';
import { ProductsRows as Products } from '@modules/order/products/rows';

export default () => new PrintCard().init();

class PrintCard {
	async init() {
		const productsPrintable = Products.get().filter(product => product.isCatalog);
		if (!productsPrintable.length) return;

		const printable = [];

		productsPrintable.forEach(product => {
			const card = product.$.find('[title^="выебри карточку:"]');
			const artikul = product.$.find('[title^="артикул:"]')?.attr('title')?.replace('артикул: ', '');
			const sku = this.getSku(artikul);
			if (!card || !sku) return;

			printable.push({ product, card, sku });
		});

		this.addPrintableButtons(printable);
	}

	addPrintableButtons(printable) {
		if (!this.needPrint(printable)) return;

		const $origBtn = $('a[href$="print/16"]');
		$origBtn.hide();

		printable.forEach(item => {
			const url = `https://php.2steblya.ru/print_card?order_id=${Order.getId()}&sku=${item.sku}&shop_crm_id=${Order.getShop().id}`;
			const $btn = $(`<li><a href="${url}" target="_blank">${item.product.title}</a></li>`);
			$btn.appendTo($origBtn.parents('ul').get(0));
		});
	}

	getSku(artikul) {
		if (!artikul) return null;
		const probableSku = parseInt(artikul.match(/^(\d+)/)?.[1]);
		return RESERVED_SKUS.includes(probableSku) ? artikul : probableSku;
	}

	needPrint(printable) {
		if (!printable.length) return false;
		if (printable.every(item => item.sku == SKU_DONAT)) return false;
		return true;
	}
}
