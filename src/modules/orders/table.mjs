import RootClass from '@helpers/root_class';
import OrdersTh from '@modules/orders/th';
import OrdersTr from '@modules/orders/tr';
import '@modules/orders/td';
import '@modules/orders/tds';
import { buildIndexes } from '@modules/orders/indexes';
import Finances from '@modules/orders/table/finances';
import CouriersSvodka from '@modules/orders/table/couriers_svodka';
import dom from '@helpers/dom';
import '@css/orders_table.css';

export default class OrdersTable extends RootClass {
	constructor() {
		super();
		this.table = dom('.js-order-list');
		this.ths = this.table.nodes('th');
		this.trs = this.table.nodes('tr[data-url]');
		this.finances = new Finances();
		this.couriersSvodka = new CouriersSvodka();
	}

	init() {
		buildIndexes(this.ths);
		this.ths.forEach(th => new OrdersTh(th).init());
		this.trs.forEach(tr => new OrdersTr(tr).init());
		this.table.attr('id', 'orders-table').addClass('loaded');
		this.finances.init();
		this.couriersSvodka.init();
		this.watch();
	}

	watch() {
		this.setObserver()
			.setSelector('tbody')
			.setTarget(this.table)
			.onAdded(tbody => new OrdersTr(dom(tbody).child('tr')).init())
			.start();
	}
}