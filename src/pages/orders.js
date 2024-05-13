import { ordersTable } from './orders_table';
import { ordersFilters } from './orders_filters';
import { isPage } from '../helpers';

export function orders() {
	if (!isPage('orders\/$')) return;

	console.log('user_jscss : orders');

	ordersFilters();
	ordersTable();

}