import ordersTable from '@modules/orders/table.mjs';
import ordersFilters from '@modules/orders/filters.mjs';

export default () => {
	ordersFilters();
	ordersTable();
}