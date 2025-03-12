import '../css/orders_filters.css';
import dates from '@helpers/dates';

export default () => {
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

	// Добавляем ссылки
	cont.append(makeLink(dates.yesterday));         		// Вчера
	cont.append(makeLink(dates.today));                     // Сегодня
	cont.append(makeLink(dates.today, dates.tomorrow));   	// Сегодня - Завтра
	cont.append(makeLink(dates.tomorrow));          		// Завтра
	cont.append(makeLink(dates.tomtomorrow));   	       	// Послезавтра

	group.append(cont);

	function makeLink(date1, date2 = date1) {
		const title = getTitle(date1, date2);
		return $(`<a class="filterDate" href="${buildUrl(date1, date2)}">${title}</a>`);
	}

	function getTitle(date1, date2) {
		if (date1 === date2) {
			if (date1.d === dates.today.d) return 'сегодня';
			if (date1.d - dates.today.d === 1) return 'завтра';
			return `${date1.dd}.${date1.mm}`;
		} else {
			return `${date1.dd}-${date2.dd}`;
		}
	}
}

//фильтр: дата заказа
function orderDate() {
	const group = getFilterGroup('Дата оформления заказа');
	if (!group) return;

	group.append(`<div class="additonalFilters">
		<a class="filterDate" href="${buildUrl(dates.today)}">${dates.today.title}</a>
		<a class="filterDate" href="${buildUrl(dates.yesterday)}">${dates.yesterday.title}</a>
		</div>`);
}


//филльтр: списание
function spisanie() {
	const group = getFilterGroup('покупатель');
	if (!group) return;

	const cont = $('<div class="additonalFilters"></div>');
	const thisMonth = getMonthDate(0);
	const prevMonth = getMonthDate(-1);
	const nextMonth = getMonthDate(1);
	const data = [
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

	const links = data.map(date =>
		`<a class="filterDate" href="${buildUrl(date.from, date.to, 'Списание')}">${date.title}</a>`
	).join('');

	cont.append(links);
	group.append(cont);

	function getMonthDate(offset) {
		const date = new Date();
		date.setMonth(date.getMonth() + offset, 2); // Ставим 2-е число
		return dates.create(date);
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