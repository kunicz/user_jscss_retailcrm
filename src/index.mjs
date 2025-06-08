import RootClass from '@helpers/root_class';
import Menu from '@src/menu';
import Popup from '@modules/popup/popup';
import Couriers from '@pages/couriers';
import Courier from '@pages/courier';
import Customer from '@pages/customer';
import Orders from '@pages/orders';
import Order from '@pages/order';
import Products from '@pages/products';
import Product from '@pages/product';
import { getCrmUser } from '@src/requests';
import { shops, fakeCustomers, noFlowers } from '@src/mappings';
import { getShops, getFakeCustomers, getNoFlowers } from '@src/requests';
import dom from '@helpers/dom';
import '@css/all.css';

window.BUNDLE_VERSION = '3.0.0';

export let user = {};

export default class App extends RootClass {
	static user = null;

	constructor() {
		super();
		this.page = null;
		this.menu = new Menu();
		this.popup = new Popup();
		this.lastPath = null; // последний путь, который был открыт
	}

	async init() {
		await this.initConstants();
		this.menu.init();
		this.popup.init();
		this.listen();
	}

	// следит за изменениями открытой страницы в приложении retailcrm (vue)
	// не использую setInterval, потому что он дает задержку даже при 0
	listen() {
		const loop = () => {
			requestAnimationFrame(loop);
			this.update();
		};
		loop();
	}

	// накатывает мои скрипты на страницу
	async update() {
		const main = dom('#main');
		if (!main || main.is('.loaded')) return;

		const pages = new Map([
			[/admin\/couriers(?:[^\/]|$)/, Couriers],
			[/admin\/couriers\/(\d+|new)/, Courier],
			[/customers\/\d+/, Customer],
			[/orders\/\d+/, Order],
			[/orders\/add/, Order],
			[/orders(?:\/)?(?:\?.*)?$/, Orders],
			[/products\/($|\?)/, Products],
			[/products\/\d+/, Product],
		]);
		for (const [pattern, page] of pages) {
			main.addClass('loaded'); // отмечает страницу как загруженную			
			if (!pattern.test(window.location.href)) continue;
			console.log(`user_jscss : retailcrm/${page.name}`); // выводит в консоль имя модуля			
			if (this.page) this.page?.destroy(); // уничтожает предыдущий модуль			
			this.page = new page();
			await Promise.resolve(this.page.init()); // инициализирует модуль
		}
	}

	// инициализация всего асинхронного контента
	async initConstants() {
		const [userResult, shopsResult, fakeCustomersResult, noFlowersResult] = await Promise.all([
			getCrmUser(dom('head').data('user-id')),
			getShops(),
			getFakeCustomers(),
			getNoFlowers()
		]);

		user = userResult;
		shops = shopsResult;
		fakeCustomers = fakeCustomersResult;
		noFlowers = noFlowersResult;
	}
}

try { new App().init(); } catch (error) { console.error(error); }
