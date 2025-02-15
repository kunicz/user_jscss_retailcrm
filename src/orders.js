import { ordersTable } from './modules/orders_table';
import { ordersFilters } from './modules/orders_filters';
import { isPage } from './index';

export function orders() {
	if (!isPage('orders\/$')) return;

	console.log('user_jscss : orders');

	ordersFilters();
	ordersTable();

}