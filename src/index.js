import retailcrm from '@helpers/retailcrm';
import menu from '@src/menu';
import * as pages from './pages';

export let user = {};

window.BUNDLE_VERSION = '2.5.2';

$(document).ready(async () => {
	try {
		user = await retailcrm.get.user.byId($('head').data('user-id'));
		menu();
		(function update() {
			// не использую setInterval, потому что он дает задержку даже при 0
			requestAnimationFrame(update);

			if ($('#main.user_jscss').length) return;
			$('#main').addClass('user_jscss');

			for (const [name, pattern] of pages.routes) {
				if (!pattern.test(window.location.pathname)) continue;
				console.log(`user_jscss : ${name}`);
				if (pages[name]) pages[name]();
				break;
			}
		})();
	} catch (error) {
		console.error(error);
	}
});
