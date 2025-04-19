import retailcrm from '@helpers/retailcrm_direct';
import Menu from '@src/menu';
import Couriers from '@pages/couriers';
import Courier from '@pages/courier';
import Customer from '@pages/customer';
import Orders from '@pages/orders';
import Order from '@pages/order';
import Products from '@pages/products';
import Product from '@pages/product';

import observers from '@helpers/observers';
import intervals from '@helpers/intervals';
import timeouts from '@helpers/timeouts';

window.BUNDLE_VERSION = '2.7.2';

export default class App {
	static user = null;
	static page = null;

	constructor() {
		this.menu = new Menu();
		this.lastPath = null; // последний путь, который был открыт
	}

	async init() {
		self.user = await self.getUser();
		this.menu.init();
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
		const main = document.querySelector('#main');
		if (!main || main.hasAttribute('loaded')) return;

		const pages = new Map([
			[/admin\/couriers(?:[^\/]|$)/, Couriers],
			[/admin\/couriers\/(\d+|new)/, Courier],
			[/customers\/\d+/, Customer],
			[/orders\/\d+/, Order],
			[/orders(?:\/)?(?:\?.*)?$/, Orders],
			[/products\/($|\?)/, Products],
			[/products\/\d+/, Product],
		]);
		for (const [pattern, module] of pages) {
			if (!pattern.test(window.location.href)) continue;

			// выводит в консоль имя модуля
			console.log(`user_jscss : retailcrm/${module.name}`);

			// отмечает страницу как загруженную
			main.setAttribute('loaded', '');

			// уничтожает предыдущий модуль
			if (App.page) {
				observers.clear(App.page.name);
				intervals.clear(App.page.name);
				timeouts.clear(App.page.name);
				App.page.destroy();
			}

			// создает новый модуль
			App.page = new module();

			// инициализирует модуль
			await Promise.resolve(App.page.init());
		}

	}

	// получает текущего пользователя
	static async getUser() {
		if (self.user) return self.user;
		const userId = document.querySelector('head').getAttribute('data-user-id');
		const user = await retailcrm.get.user.byId(userId);
		return user;
	}
}

const self = App;
const app = new App();
try {
	app.init();
} catch (error) {
	console.error(error);
}
