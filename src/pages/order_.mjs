import RootClass from '@helpers/root_class';
import Common from '@modules/order/sections/common';
import CustomFields from '@modules/order/sections/custom_fields';
import Comments from '@modules/order/sections/comments';
import Discount from '@modules/order/sections/discount';
import Products from '@modules/order/sections/products';
import Dostavka from '@modules/order/sections/dostavka';
import Zakazchik from '@modules/order/sections/zakazchik';
import PrintCard from '@modules/order/print_card';
import Finances from '@modules/order/finances';
import normalize from '@helpers/normalize';
import retailcrm from '@helpers/retailcrm_direct';
import '@css/order.css';

export default class Order extends RootClass {
	static name = 'order';
	static intaro = 'intaro_crmbundle_ordertype';
	static crm = null;
	static flowersCrm = null;

	constructor() {
		super();
		this.sections = [
			new Common(),
			new CustomFields(),
			new Comments(),
			new Dostavka(),
			new Zakazchik(),
			new Discount(),
			new Products(),
			new PrintCard(),
		];
	}

	async init() {
		// получаем данные о заказе из CRM один раз до конца сессии
		self.crm = await self.getCrm();

		// получаем данные о товарах-цветах из CRM один раз до конца сессии
		self.flowersCrm = await self.getFlowersCrm();

		// инициализируем секции
		for (const section of this.sections) {
			await Promise.resolve(section.init());
		}

		// инициализируем финансы
		Finances.init();
	}

	// возвращает id заказа
	static getId() {
		return normalize.int($('head title').text());
	}

	// возвращает статус заказа
	static getStatus() {
		return $('#select').text().trim();
	}

	// возвращает данные о магазине
	static getShop() {
		const $shop = $(`#${self.intaro}_site option:selected`);
		return {
			id: normalize.int($shop.val()),
			code: $shop.data('code'),
			title: $shop.text()
		}
	}

	// возвращает объект заказа из CRM
	static async getCrm() {
		const crm = await retailcrm.get.order.byId(self.getId());
		return crm;
	}

	// получает данные о товарах-цветах из CRM один раз до конца сессии
	static async getFlowersCrm() {
		const flowersCrm = await retailcrm.get.products.flowers();
		return flowersCrm;
	}
}

const self = Order;
