import ordersTable from '../modules/orders_table.js';
import ordersFilters from '../modules/orders_filters.js';

export default () => {
	ordersFilters();
	ordersTable();
}