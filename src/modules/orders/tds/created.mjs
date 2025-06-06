import OrdersTd from '@modules/orders/td';

export default class CreatedTd extends OrdersTd {
	static columnName = 'created';

	init() {
		this.td.hide();
	}
}
OrdersTd.registerClass(CreatedTd);