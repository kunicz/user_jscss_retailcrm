import { isPage } from '../helpers';
import '../css/not_admin.css';

export function notAdmin() {

	//реордер на главную, если не админ
	if (isPage('\/admin(?:(?!\/couriers).*)?$|\/analytics|\/sites|\/chats|\/marketing')) {
		if (!$('html').is('.notAdmin')) return;
		console.log('not allowed');
		$('body').hide();
		window.location.href = '/orders';
	}

}

export function toggleAdmin() {

	//переключение режима админ/не админ
	$(window).on('keypress', function (e) {
		/* shift+space */
		if (e.shiftKey && e.which == 32) {
			e.preventDefault();
			$('html').toggleClass('notAdmin');
			notAdmin();
		}
	});

	//убираем меню
	setInterval(function () {
		$('body').toggleClass('no-menu', $('html').is('.notAdmin') && isPage('admin\/*'));
	}, 500);

}