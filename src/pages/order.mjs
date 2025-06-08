import RootClass from '@helpers/root_class';
import OrderSections from '@modules/order/sections';
import PrintCard from '@modules/order/print_card';
import Finances from '@modules/order/finances';
import normalize from '@helpers/normalize';
import { getCrmOrder } from '@src/requests';
import wait from '@helpers/wait';
import dom from '@helpers/dom';
import '@css/order.css';

export default class Order extends RootClass {
	static name = 'order';

	constructor() {
		super();
		this.id = normalize.number(dom('#order-form').attr('action'));
		this.finances = null;
		this.printCard = null;
		this.properties = null;
	}

	async init() {
		await wait.halfsec(); // иногда бывает такое, что vue не успевает инициализироваться
		await this.crm();
		for (const Section of OrderSections) await Promise.resolve(new Section().init()); // инициализируем секции
		this.finances = new Finances().init();
		this.printCard = new PrintCard().init();
	}

	// получаем данные заказа из внешних источников
	// вешаем на #main
	async crm() {
		const crm = this.id ? await getCrmOrder(this.id) : {};
		dom('#main').data('crm', crm);
	}
}
