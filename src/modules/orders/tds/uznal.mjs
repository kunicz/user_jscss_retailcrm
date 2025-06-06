import OrdersTd from '@modules/orders/td';

export default class UznalTd extends OrdersTd {
	static columnName = 'uznal';

	init() {
		this.td.hide();
		this.actualUznal();
	}

	actualUznal() {

	}
}
OrdersTd.registerClass(UznalTd);