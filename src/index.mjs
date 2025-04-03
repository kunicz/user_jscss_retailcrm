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

window.BUNDLE_VERSION = '2.5.15';

export default class App {
	static user = null;

	constructor() {
		this.menu = new Menu();
	}

	async init() {
		await self.getUser();
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
		if (this.isLoaded()) return;

		BundleLoader.init('retailcrm', new Map([
			[/admin\/couriers(?:[^\/]|$)/, new Couriers()],
			[/admin\/couriers\/(\d+|new)/, new Courier()],
			[/customers\/\d+/, new Customer()],
			[/orders\/\d+/, new Order()],
			[/orders(?:\/)?(?:\?.*)?$/, new Orders()],
			[/products\/[$|\?]/, new Products()],
			[/products\/\d+/, new Product()],
		]));

		self.$main().addClass('user_jscss');
	}

	// проверяет, загружена ли страница
	isLoaded() {
		return self.$main().hasClass('user_jscss');
	}

	static $main() {
		return $('#main');
	}

	// получает текущего пользователя
	static async getUser() {
		if (self.user) return self.user;
		const userId = $('head').data('user-id');
		self.user = await retailcrm.get.user.byId(userId);
		return self.user;
	}
}

const self = App;
const app = new App();
try {
	app.init();
} catch (error) {
	console.log('index.mjs: ошибка');
	console.error(error);
}
