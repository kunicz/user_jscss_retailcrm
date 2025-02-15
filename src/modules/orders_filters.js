import '../css/orders_filters.css';
import { makeDate } from '@helpers';

export function ordersFilters() {
	dostavkaDate();
	orderDate();
	spisanie();
	batchHide();
	otkudaUznal();
}

//фильтр: дата доставки
function dostavkaDate() {
	const group = getFilterGroup('дата доставки');
	if (!group) return;

	const cont = $('<div class="additonalFilters"></div>');
	const today = makeDate();

	// Добавляем ссылки
	cont.append(makeLink(makeDate(today.obj, -1)));         // Вчера
	cont.append(makeLink(today));                           // Сегодня
	cont.append(makeLink(today, makeDate(today.obj, 1)));   // Сегодня - Завтра
	cont.append(makeLink(makeDate(today.obj, 1)));          // Завтра
	cont.append(makeLink(makeDate(today.obj, 2)));          // Послезавтра

	group.append(cont);

	function makeLink(date1, date2 = date1) {
		let title;

		if (date1 === date2) {
			title = `${date1.dd}.${date1.mm}`;
			if (date1.d === today.d) title = 'сегодня';
			if (date1.d - today.d === 1) title = 'завтра';
		} else {
			title = `${date1.dd}-${date2.dd}`;
		}

		return $(`<a class="filterDate" href="${buildUrl(date1, date2)}">${title}</a>`);
	}
}

//фильтр: дата заказа
function orderDate() {
	const group = getFilterGroup('Дата оформления заказа');
	if (!group) return;

	const cont = $('<div class="additonalFilters"></div>');
	const dates = {
		сегодня: makeDate(),
		вчера: makeDate(new Date(), -1)
	};

	const links = Object.entries(dates).map(([title, date]) =>
		`<a class="filterDate" href="${buildUrl(date)}">${title}</a>`
	).join('');

	cont.append(links);
	group.append(cont);
}


//филльтр: списание
function spisanie() {
	const group = getFilterGroup('покупатель');
	if (!group) return;

	const cont = $('<div class="additonalFilters"></div>');

	const thisMonth = getMonthDate(0);
	const prevMonth = getMonthDate(-1);
	const nextMonth = getMonthDate(1);

	const dates = [
		{
			title: `списание (${thisMonth.month})`,
			from: thisMonth.str,
			to: nextMonth.str
		},
		{
			title: `списание (${prevMonth.month})`,
			from: prevMonth.str,
			to: thisMonth.str
		}
	];

	const links = dates.map(date =>
		`<a class="filterDate" href="${buildUrl(date.from, date.to, 'Списание')}">${date.title}</a>`
	).join('');

	cont.append(links);
	group.append(cont);

	function getMonthDate(offset) {
		const date = new Date();
		date.setMonth(date.getMonth() + offset, 2); // Ставим 2-е число
		return makeDate(date);
	}

	function buildUrl(from, to, customer = '') {
		const params = new URLSearchParams({
			'filter[customer]': customer,
			'filter[deliveryDateFrom][abs]': from,
			'filter[deliveryDateTo][abs]': to,
			'filter[sort]': 'created_at',
			'filter[direction]': 'desc'
		});
		return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
	}
}

//показывать/скрывать сервисные заказы
function batchHide() {
	$('<div class="additonalFilters inFooter"><a>Технические заказы</a></div>')
		.insertAfter($('.m-filter .parameters'))
		.on('click', e => {
			e.preventDefault();
			$('tr.batchHide').toggle();
		});
}

//показывать/скрывать откуда узнал
function otkudaUznal() {
	$('<div class="additonalFilters inFooter"><a>Откуда узнал</a></div>')
		.insertAfter($('.m-filter .parameters'))
		.on('click', e => {
			e.preventDefault();
			$('[type*="узнал о нас"]').toggle();
			$('.js-order-list th:last').toggle();
		});
}





function getFilterGroup(name) {
	const filterGroups = $('.default-form-filter .filter-group').filter((_, group) =>
		$(group).find('.control-label span').text().trim().toLowerCase() === name.trim().toLowerCase()
	);

	return filterGroups.length ? filterGroups.eq(0) : null;
}

function buildUrl(date1, date2 = date1) {
	const params = new URLSearchParams({
		'filter[deliveryDateFrom][abs]': date1.str,
		'filter[deliveryDateTo][abs]': date2.str,
		'filter[sort]': 'delivery_time_string',
		'filter[direction]': 'asc'
	});
	return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}