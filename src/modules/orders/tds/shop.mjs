import * as cols from '@modules/orders/cols';
import { shopIcon } from '@src/mappings';
import OrderTd from '@modules/orders/td';

export default class ShopTd extends OrderTd {
	static columnName = 'shop';

	constructor(row) {
		super(row);
	}

	init() {
		this.logo();
	}

	// лого вместо названия магазина для клмпактности
	logo() {
		this.$td.prepend(`<img src="${shopIcon(this.get())}" class="logo" />`);
		this.$native.hide();
	}
}
