import common from '@modules/order/common';
import customFields from '@modules/order/custom_fields';
import printCard from '@modules/order/print_card';
import comments from '@modules/order/comments';
import discount from '@modules/order/discount';
import products from '@modules/order/products';
import dostavka from '@modules/order/dostavka';
import zakazchik from '@modules/order/zakazchik';
import normalize from '@helpers/normalize';
import '@css/order.css';

export default () => new Order().init();
export class Order {
	static intaro = 'intaro_crmbundle_ordertype';
	static id = normalize.int($('head title').text());

	constructor() { }

	init() {
		common(this);
		customFields(this);
		comments(this);
		dostavka(this);
		zakazchik(this);
		discount(this);
		products(this);
		printCard(this);
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
}