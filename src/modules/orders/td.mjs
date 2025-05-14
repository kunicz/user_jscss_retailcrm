import RootClass from '@helpers/root_class';
import * as cols from '@modules/orders/cols';

export default class OrderTd extends RootClass {
	static columnName = 'default';  // Базовое значение

	constructor(row) {
		super();
		this.row = row;
		this.orderCrm = row.orderCrm;
		this.col = this.constructor.columnName;
		this.$td = this.row.$td(cols[this.col]);
		this.$native = this.$td.children('.native');
	}

	// возвращает текущеезначение ячейки
	get() {
		return this.row.get(cols[this.col]);
	}

	// возвращает оригинальное содержимое ячейки
	getNative() {
		return this.row.getNative(cols[this.col]);
	}
}
