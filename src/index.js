import { product } from './product';
import { products } from './products';
import { courier } from './courier';
import { couriers } from './couriers';
import { order } from './order';
import { orders } from './orders';
import { customer } from './customer';
import { menu } from './menu';
import { retailcrm, cache } from '@helpers';

window.BUNDLE_VERSION = '2.1.3';

export let user = cache();

$(document).ready(async () => {

	user.set(await getUser());

	menu();
	checkVueUpdate();

	function checkVueUpdate() {
		//не могу использовать setInterval, потому что он замирает в какой-то момент на пару секунд
		requestAnimationFrame(checkVueUpdate);

		if ($('#main.user_jscss').length) return;
		$('#main').addClass('user_jscss');

		product();
		products();
		courier();
		couriers();
		orders();
		order();
		customer();

	}
});

export function isPage(page) {
	return new RegExp(page).test(window.location.pathname);
}

async function getUser() {
	const userId = $('head').data('user-id');
	return await retailcrm.get.user.byId(userId);
}
