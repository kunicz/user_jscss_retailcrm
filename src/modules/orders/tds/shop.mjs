import { getShopIcon } from '@src/mappings';
import OrdersTd from '@modules/orders/td';

export default class ShopTd extends OrdersTd {
	static columnName = 'shop';

	init() {
		this.logo();
	}

	// лого вместо названия магазина для компактности
	logo() {
		const shopTitle = this.td.txt();
		const icon = getShopIcon(this.crm.site);
		this.td.html(`<img src="${icon}" title="${shopTitle}" class="logo" />`);
	}
}
OrdersTd.registerClass(ShopTd);