import common from '@modules/order/sections/common';
import customFields from '@modules/order/sections/custom_fields';
import comments from '@modules/order/sections/comments';
import discount from '@modules/order/sections/discount';
import products from '@modules/order/sections/products';
import dostavka from '@modules/order/sections/dostavka';
import zakazchik from '@modules/order/sections/zakazchik';
import printCard from '@modules/order/print_card';
import normalize from '@helpers/normalize';
import retailcrm from '@helpers/retailcrm_direct';
import { ProductsData } from '@modules/order/products_data/data';
import { Finances } from '@modules/order/finances';
import '@css/order.css';

export default () => new Order().init();

export class Order {
	static intaro = 'intaro_crmbundle_ordertype';
	static crm = null;

	async init() {
		await Order.getCrm();
		await ProductsData.init();
		Finances.init();

		common();
		customFields();
		comments();
		dostavka();
		zakazchik();
		discount();
		products();
		printCard();
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
		const $shop = $(`#${Order.intaro}_site option:selected`);
		return {
			id: normalize.int($shop.val()),
			code: $shop.data('code'),
			title: $shop.text()
		}
	}

	// возвращает объект заказа из CRM
	static async getCrm() {
		if (Order.crm) return Order.crm;
		Order.crm = await retailcrm.get.order.byId(Order.getId());
		return Order.crm;
	}
}