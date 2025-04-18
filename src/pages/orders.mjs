import OrdersTable from '@modules/orders/table';
import OrdersFilters from '@modules/orders/filters';

export default class Orders {
	static name = 'orders';

	constructor() {
		this.filters = new OrdersFilters();
		this.table = new OrdersTable();
	}

	init() {
		this.filters.init();
		this.table.init();
	}

	destroy() {
		this.filters?.destroy?.();
		this.table?.destroy?.();
	}
}