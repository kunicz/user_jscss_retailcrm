import { getShopIcon } from '@src/mappings';
import OrdersTd from '@modules/orders/td';

export default class ShopTd extends OrdersTd {
	static columnName = 'shop';

	init() {
		this.logo();
	}

	// лого вместо названия магазина для компактности
	logo() {
		const shop = this.td.txt();
		const icon = getShopIcon(shop);
		this.td.html(`<img src="${icon}" title="${shop}" class="logo" />`);
	}
}
OrdersTd.registerClass(ShopTd);