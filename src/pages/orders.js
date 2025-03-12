import ordersTable from '@modules/orders/table';
import ordersFilters from '@modules/orders/filters';

export default () => {
	ordersFilters();
	ordersTable();
}