import OrdersTable from '@modules/orders/table';
import OrdersFilters from '@modules/orders/filters';

export default class Orders {
	static moduleName = 'orders';

	init() {
		new OrdersFilters().init();
		new OrdersTable().init();
	}
}