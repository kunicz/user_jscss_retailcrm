import { copy } from '@helpers/clipboard';
import normalize from '@helpers/normalize';

export default (table) => new CouriersSvodka(table).init();

class CouriersSvodka {
	constructor(table) {
		this.table = table;
		this.block = $('<span><a id="couriersSvodka">Сводка по оплате курьерам</a></span>');
	}

	init() {
		this.block
			.appendTo($('#list-total-wrapper'))
			.on('click', () => copy(this.generate(this.aggregate())));
	}

	aggregate() {
		const $tds = this.table.$trs().find('td[col="курьер"]');
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
		console.log(data);
		return data;
	}

	generate(data) {
		const from = this.formatDate($('#filter_deliveryDate_gte_abs').val());
		const to = this.formatDate($('#filter_deliveryDate_lte_abs').val());
		let output = '';
		output += from && to ? `с ${from} по ${to}` : from ? `за ${from}` : '';
		output += '\n-------\n';
		output += data.map(c => `${c.name}${c.comments ? ` (${c.comments})` : ''}${c.phone ? ` / ${c.phone}` : ''}${c.bank ? ` (${c.bank})` : ''} / ${c.price} ₽`).join('\n');
		output += `\n-------\n`;
		output += `скопировано в ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
		return output;
	}

	formatDate(dateString) {
		if (!dateString) return '';
		return dateString.split('-').reverse().slice(0, 2).join('.');
	}

}