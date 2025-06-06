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
import retailcrm from '@helpers/retailcrm_direct';
import { shops, getShops, fakeCustomers, getFakeCustomers, noFlowers, getNoFlowers } from '@src/mappings';
import dom from '@helpers/dom';

window.BUNDLE_VERSION = '2.10.1';

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
			[/orders(?:\/)?(?:\?.*)?$/, Orders],
			[/products\/($|\?)/, Products],
			[/products\/\d+/, Product],
		]);
		for (const [pattern, page] of pages) {
			if (!pattern.test(window.location.href)) continue;
			console.log(`user_jscss : retailcrm/${page.name}`); // выводит в консоль имя модуля			
			main.addClass('loaded'); // отмечает страницу как загруженную			
			if (this.page) this.page?.destroy(); // уничтожает предыдущий модуль			
			this.page = new page();
			await Promise.resolve(this.page.init()); // инициализирует модуль
		}
	}

	// инициализация всего асинхронного контента
	async initConstants() {
		const [userResult, shopsResult, fakeCustomersResult, noFlowersResult] = await Promise.all([
			this.getUser(),
			getShops(),
			getFakeCustomers(),
			getNoFlowers()
		]);

		App.user = userResult;
		shops = shopsResult;
		fakeCustomers = fakeCustomersResult;
		noFlowers = noFlowersResult;
	}

	// получает текущего пользователя
	async getUser() {
		const userId = dom('head').data('user-id');
		const user = await retailcrm.get.user.byId(userId);
		return user;
	}
}

try { new App().init(); } catch (error) { console.error(error); }
