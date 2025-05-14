import RootClass from '@helpers/root_class';
import '@css/couriers.css';

export default class Couriers extends RootClass {
	static name = 'couriers';

	init() {
		this.description();
	}

	// добавляет описание курьера в виде HTML в блок .courier-text
	description() {
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
}