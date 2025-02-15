import { isPage } from './index';
import './css/couriers.css';

export function couriers() {
	if (!isPage('admin\/couriers(?:[^\/]|$)')) return;

	console.log('user_jscss : couriers');

	description();
}

function description() {
	const rows = $('#main .tab-section table tbody tr');
	rows.each(i => {
		const descrBlock = rows.eq(i).children('.courier-text');
		if (!descrBlock.text()) return;
		const descr = JSON.parse(descrBlock.text());
		let html = '';
		for (let key in descr) {
			if (descr.hasOwnProperty(key) && descr[key] !== '') {
				html += `<p>${descr[key]}</p>`;
			}
		}
		descrBlock.html(html);
	});
}