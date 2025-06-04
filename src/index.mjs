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
import dom from '@helpers/dom';

window.BUNDLE_VERSION = '2.9.0';

export default class App extends RootClass {
	static user = null;
	static page = null;
	static menu = new Menu();
	static popup = new Popup();

	constructor() {
		super();
		this.lastPath = null; // последний путь, который был открыт
	}

	async init() {
		App.user = await App.getUser();
		App.menu.init();
		App.popup.init();
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
			if (App.page) App.page?.destroy(); // уничтожает предыдущий модуль			
			App.page = new page();
			await Promise.resolve(App.page.init()); // инициализирует модуль
		}
	}

	// получает текущего пользователя
	static async getUser() {
		if (App.user) return App.user;
		const userId = dom('head').data('user-id');
		const user = await retailcrm.get.user.byId(userId);
		return user;
	}
}

try { new App().init(); } catch (error) { console.error(error); }
