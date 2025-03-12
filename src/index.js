import retailcrm from '@helpers/retailcrm';
import menu from './menu.js';
import * as pages from './pages/index.js';

export let user = {};

window.BUNDLE_VERSION = '2.4.1';

$(document).ready(async () => {
	try {
		user = await retailcrm.get.user.byId($('head').data('user-id'));
		menu();
		(function update() {
			// не использую setInterval, потому что он дает задержку даже при 0
			requestAnimationFrame(update);

			if ($('#main.user_jscss').length) return;
			$('#main').addClass('user_jscss');

			for (const [title, pattern] of pages.routes) {
				if (!new RegExp(pattern).test(window.location.pathname)) continue;
				console.log(`user_jscss : ${title}`);
				if (pages[title]) pages[title]();
				break;
			}
		})();
	} catch (e) {
		console.error(e);
	}
});
