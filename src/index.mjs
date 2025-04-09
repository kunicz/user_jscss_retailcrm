import BundleLoader from '@bundle_loader';
import retailcrm from '@helpers/retailcrm_direct';
import Menu from '@src/menu';
import Couriers from '@pages/couriers';
import Courier from '@pages/courier';
import Customer from '@pages/customer';
import Orders from '@pages/orders';
import Order from '@pages/order';
import Products from '@pages/products';
import Product from '@pages/product';

window.BUNDLE_VERSION = '2.5.16';

export default class App {
	static user = null;

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
	update() {
		if (!this.shouldUpdate()) return;

		BundleLoader.init('retailcrm', new Map([
			[/admin\/couriers(?:[^\/]|$)/, new Couriers()],
			[/admin\/couriers\/(\d+|new)/, new Courier()],
			[/customers\/\d+/, new Customer()],
			[/orders\/\d+/, new Order()],
			[/orders(?:\/)?(?:\?.*)?$/, new Orders()],
			[/products\/[$|\?]/, new Products()],
			[/products\/\d+/, new Product()],
		]));

		self.$main().addClass('loaded');
	}

	// проверяет, нужно ли обновлять страницу
	shouldUpdate() {
		const currentPath = window.location.href;
		if (this.lastPath === currentPath || this.isLoaded()) return false;
		this.lastPath = currentPath;
		return true;
	}

	// проверяет, загружена ли страница
	isLoaded() {
		return self.$main().hasClass('loaded');
	}

	// получает текущего пользователя
	static async getUser() {
		if (self.user) return self.user;
		const userId = document.querySelector('head').getAttribute('data-user-id');
		const user = await retailcrm.get.user.byId(userId);
		return user;
	}

	// возвращает элемент #main
	static $main() {
		return $('#main');
	}
}

const self = App;
const app = new App();
try {
	app.init();
} catch (error) {
	console.error(error);
}
