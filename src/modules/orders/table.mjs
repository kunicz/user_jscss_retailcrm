import RootClass from '@helpers/root_class';
import OrdersTh from '@modules/orders/th';
import OrdersTr from '@modules/orders/tr';
import '@modules/orders/td';
import '@modules/orders/tds';
import { buildIndexes } from '@modules/orders/indexes';
import Finances from '@modules/orders/finances';
import CouriersSvodka from '@modules/orders/couriers_svodka';
import dom from '@helpers/dom';
import '@css/orders_table.css';

export default class OrdersTable extends RootClass {
	constructor() {
		super();
		this.table = dom.one('.js-order-list');
		this.ths = this.table.nodes('th');
		this.trs = this.table.nodes('tr[data-url]');
		this.finances = new Finances();
		this.couriersSvodka = new CouriersSvodka();
	}

	init() {
		this.table.attr('id', 'orders-table');
		buildIndexes(this.ths);
		this.ths.forEach(th => new OrdersTh(th).init());
		this.trs.forEach(tr => new OrdersTr(tr).init());
		this.finances.init();
		this.couriersSvodka.init();
		this.table.addClass('loaded');
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