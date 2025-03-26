import { copy } from '@helpers/clipboard';

export default ($trs) => {
	$(`<span><a id="couriersSvodka">Сводка по оплате курьерам</a></span>`)
		.appendTo($('#list-total-wrapper'))
		.on('click', () => copy(generate(aggregate($trs))));
}

function aggregate($trs) {
	const $tds = $trs.find('td[type="курьер"]');
	let data = $tds.map((_, e) => $(e).data('svodka')).get().reduce((acc, curr) => {
		if (curr.name === 'Другой курьер') {
			acc.push({ ...curr });
		} else {
			const existing = acc.find(item => item.name === curr.name);
			if (existing) {
				existing.price += curr.price;
			} else {
				acc.push({ ...curr });
			}
		}
		return acc;
	}, []);
	data = data.sort((a, b) => a.name.localeCompare(b.name));
	return data;
}

function generate(data) {
	const from = formatDate($('#filter_deliveryDate_gte_abs').val());
	const to = formatDate($('#filter_deliveryDate_lte_abs').val());
	let output = '';
	output += from && to ? `с ${from} по ${to}` : from ? `за ${from}` : '';
	output += '\n-------\n';
	output += data.map(c => `${c.name}${c.comments ? ` (${c.comments})` : ''}${c.phone ? ` / ${c.phone}` : ''}${c.bank ? ` (${c.bank})` : ''} / ${c.price} ₽`).join('\n');
	output += `\n-------\n`;
	output += `скопировано в ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
	return output;
}

function formatDate(dateString) {
	if (!dateString) return '';
	return dateString.split('-').reverse().slice(0, 2).join('.');
}
