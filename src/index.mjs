import { init } from '@bundle_loader';
import retailcrm from '@helpers/retailcrm_direct';
import menu from '@src/menu';
import couriers from '@pages/couriers';
import courier from '@pages/courier';
import customer from '@pages/customer';
import orders from '@pages/orders';
import order from '@pages/order';
import products from '@pages/products';
import product from '@pages/product';

export let user = {};

window.BUNDLE_VERSION = '2.5.6';

$(document).ready(async () => {
	try {
		user = await retailcrm.get.user.byId($('head').data('user-id'));
		menu();
		(function update() {
			// не использую setInterval, потому что он дает задержку даже при 0
			requestAnimationFrame(update);

			if ($('#main.user_jscss').length) return;
			$('#main').addClass('user_jscss');

			init('retailcrm', new Map([
				[/admin\/couriers(?:[^\/]|$)/, { couriers }],
				[/admin\/couriers\/(\d+|new)/, { courier }],
				[/customers\/\d+/, { customer }],
				[/orders\/$/, { orders }],
				[/orders\/\d+/, { order }],
				[/products\/$/, { products }],
				[/products\/\d+/, { product }],
			]));
		})();
	} catch (error) {
		console.error(error);
	}
});
