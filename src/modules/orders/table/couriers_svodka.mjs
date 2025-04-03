import { copy } from '@helpers/clipboard';
import normalize from '@helpers/normalize';
import { default as table } from '@modules/orders/table';

export default class CouriersSvodka {
	constructor() {
		this.block = $('<span><a id="couriersSvodka">Сводка по оплате курьерам</a></span>');
		this.separator = '\n-------\n';
	}

	init() {
		this.block
			.appendTo($('#list-total-wrapper'))
			.on('click', () => copy(this.generate(this.aggregate())));
	}

	aggregate() {
		const $tds = table.$trs().find('td[col="курьер"]');
		let data = $tds.map((_, e) => $(e).data('svodka')).get().reduce((acc, curr) => {
			if (curr.name === 'Другой курьер') {
				acc.push({ ...curr });
			} else {
				const existing = acc.find(item => item.name === curr.name);
				if (existing) {
					existing.price = normalize.int(existing.price) + normalize.int(curr.price);
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
		const from = this.formatDate($('#filter_deliveryDate_gte_abs').val());
		const to = this.formatDate($('#filter_deliveryDate_lte_abs').val());
		let output = '';
		if (from && to && from === to) output = `за ${from}`;
		if (from && to && from !== to) output = `с ${from} по ${to}`;
		if (from && !to) output = `с ${from}`;
		if (!from && to) output = `до ${to}`;
		//if (!from && !to) output = 'за все время';
		return output ? output += this.separator : '';
	}

}