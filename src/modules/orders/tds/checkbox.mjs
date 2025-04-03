import * as cols from '@modules/orders/cols';
import copyBtn from '@helpers/clipboard';
import OrderTd from '@modules/orders/td';

export default class CheckboxTd extends OrderTd {
	static columnName = 'checkbox';

	constructor(row) {
		super(row);
	}

	init() {
		this.orderId();
	}

	// кликабельный номер заказа под чекбокс
	orderId() {
		const $id = this.row.td(cols.number).find('a');
		this.$td.append('<br>').append(copyBtn($id));
	}
}