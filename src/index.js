import { menu } from './pages/menu';
import { product } from './pages/product';
import { courier } from './pages/courier';
import { couriers } from './pages/couriers';
import { order } from './pages/order';
import { orders } from './pages/orders';
import { customer } from './pages/customer';
import { notAdmin, toggleAdmin } from './pages/admin';

$(document).ready(() => {

	$('html').addClass('notAdmin');
	notAdmin();

	function checkVueUpdate() {
		//не могу использовать setInterval, потому что он замирает в какой-то момент на пару секунд
		requestAnimationFrame(checkVueUpdate);

		if ($('#main.user_jscss').length) return;
		$('#main').addClass('user_jscss');

		notAdmin();
		product();
		courier();
		couriers();
		orders();
		order();
		customer();

	}

	checkVueUpdate();
	toggleAdmin();
	menu();

});
