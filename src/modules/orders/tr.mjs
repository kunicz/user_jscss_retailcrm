import RootClass from '@helpers/root_class';
import OrdersTd from '@modules/orders/td';
import normalize from '@helpers/normalize';
import retailcrm from '@helpers/retailcrm_direct';
import { fakeCustomers, orderIsDoneStatuses } from '@src/mappings';
import { ARTIKUL_DONAT } from '@root/config';

export default class OrdersRow extends RootClass {
	constructor(tr) {
		super();
		this.tr = tr;
		this.tds = tr.nodes('td');
		this.crm = null;
	}

	async init() {
		this.crm = await this.getCrm();
		this.tr.data('crm', this.crm); // получаем и консервиуем данные заказа из CRM
		this.hasDonat();
		this.isDone();
		this.isFakeCustomer();
		this.isBatchHide();
		this.tds.forEach(td => new OrdersTd(td).init());
		this.tr.addClass('loaded');
	}

	// получает данные заказа из CRM по id заказа
	async getCrm() {
		const id = normalize.number(this.tr.data('url'));
		const orderCrm = await retailcrm.get.order.byId(id);
		return orderCrm;
	}

	// проверяет наличие доната в заказе
	hasDonat() {
		if (!this.crm.items) return false;
		this.tr.hasDonat = this.crm.items.some(item => item.offer?.article == ARTIKUL_DONAT);
	}

	// проверяет, является ли клиент фейковым
	// так как данные о фейковых клиентах приходят из CRM, то проверка происходит асинхронно
	isFakeCustomer() {
		this.tr.isFakeCustomer = fakeCustomers.some(customer => customer.id === this.crm.customer.id);
	}

	// проверяет, является ли заказ оконченным
	isDone() {
		this.tr.isDone = orderIsDoneStatuses.includes(this.crm.status);
	}

	// проверяет, является ли заказ "неинтересным"
	// такие заказы можно пакетно скрывать
	isBatchHide() {
		this.tr.isBatchHide = this.tr.isFakeCustomer || this.isDonat || this.crm.status === 'razobran';
	}
}