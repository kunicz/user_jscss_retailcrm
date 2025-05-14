import RootClass from '@helpers/root_class';
import OrdersTable from '@modules/orders/table';
import OrdersFilters from '@modules/orders/filters';

export default class Orders extends RootClass {
	static name = 'orders';

	constructor() {
		super();
		this.filters = new OrdersFilters();
		this.table = new OrdersTable();
	}

	init() {
		this.filters.init();
		this.table.init();
	}
}