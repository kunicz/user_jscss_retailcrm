import copyBtn from '@helpers/clipboard';
import OrdersTd from '@modules/orders/td';

export default class CheckboxTd extends OrdersTd {
	static columnName = 'checkbox';

	init() {
		this.orderId();
	}

	// кликабельный номер заказа под чекбокс
	orderId() {
		this.td.toLast('<br>').toLast(copyBtn(this.crm.number));
	}
}
OrdersTd.registerClass(CheckboxTd);