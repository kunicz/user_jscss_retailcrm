import Common from '@modules/order/sections/common';
import CustomFields from '@modules/order/sections/custom_fields';
import Comments from '@modules/order/sections/comments';
import Discount from '@modules/order/sections/discount';
import Products from '@modules/order/sections/products';
import Dostavka from '@modules/order/sections/dostavka';
import Zakazchik from '@modules/order/sections/zakazchik';
import PrintCard from '@modules/order/print_card';
import ProductsData from '@modules/order/products_data/builder';
import Finances from '@modules/order/finances';
import normalize from '@helpers/normalize';
import retailcrm from '@helpers/retailcrm_direct';
import '@css/order.css';

export default class Order {
	static moduleName = 'order';
	static intaro = 'intaro_crmbundle_ordertype';
	static crm = null;

	async init() {
		// получаем данные о заказе из CRM один раз до конца сессии
		await self.getCrm();
		// собираем данные по всем товарам в заказе
		await ProductsData.init();
		// инициализируем финансы
		Finances.init();

		new Common().init();
		new CustomFields().init();
		new Comments().init();
		new Dostavka().init();
		new Zakazchik().init();
		new Discount().init();
		new Products().init();
		new PrintCard().init();
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
		if (self.crm) return self.crm;
		self.crm = await retailcrm.get.order.byId(self.getId());
		return self.crm;
	}
}

const self = Order;
