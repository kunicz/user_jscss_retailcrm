import RootClass from '@helpers/root_class';
import { copy } from '@helpers/clipboard';
import normalize from '@helpers/normalize';
import dom from '@helpers/dom';

export default class CouriersSvodka extends RootClass {
	constructor() {
		super();
		this.separator = '\n-------\n';
	}

	init() {
		dom('<span><a id="couriersSvodka">Сводка по оплате курьерам</a></span>')
			.lastTo('#list-total-wrapper')
			.listen('click', () => copy(this.generate(this.aggregate())));
	}

	aggregate() {
		const tds = dom('#orders-table').nodes('td[col="courier"]');
		let data = tds.map(td => td.data('svodka')).reduce((acc, curr) => {
			if (!curr) return acc;
			if (curr.name === 'Другой курьер') {
				acc.push({ ...curr });
			} else {
				const existing = acc.find(item => item.name === curr.name);
				if (existing) {
					existing.price = normalize.number(existing.price) + normalize.number(curr.price);
				} else {
					acc.push({ ...curr });
				}
			}
			return acc;
		}, []);
		data = data.sort((a, b) => a.name.localeCompare(b.name));
		return data;
	}

	generate(data) {
		let output = this.fromTo();
		output += data.map(c => `${c.name}${c.comments ? ` (${c.comments})` : ''}${c.phone ? ` / ${c.phone}` : ''}${c.bank ? ` (${c.bank})` : ''} / ${c.price} ₽`).join('\n');
		output += this.separator;
		output += `скопировано в ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
		return output;
	}

	formatDate(dateString) {
		if (!dateString) return '';
		return dateString.split('-').reverse().slice(0, 2).join('.');
	}

	fromTo() {
		const from = this.formatDate(dom('#filter_deliveryDate_gte_abs').val());
		const to = this.formatDate(dom('#filter_deliveryDate_lte_abs').val());
		let output = '';
		if (from && to && from === to) output = `за ${from}`;
		if (from && to && from !== to) output = `с ${from} по ${to}`;
		if (from && !to) output = `с ${from}`;
		if (!from && to) output = `до ${to}`;
		//if (!from && !to) output = 'за все время';
		return output ? output += this.separator : '';
	}

}