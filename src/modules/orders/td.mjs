import * as cols from '@modules/orders/cols';

export default class OrderTd {
	static columnName = 'default';  // Базовое значение

	constructor(row, orderCrm = null) {
		this.row = row;
		this.orderCrm = orderCrm;
		this.col = this.constructor.columnName;
		this.$td = this.row.td(cols[this.col]);
		this.$native = this.$td.children('.native');
	}

	get() {
		return this.row.get(cols[this.col]);
	}

	getNative() {
		return this.row.getNative(cols[this.col]);
	}
}
