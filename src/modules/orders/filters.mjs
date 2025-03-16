import dates from '@helpers/dates.mjs';
import '@css/orders_filters.css';

export default () => {
	dostavkaDate();
	orderDate();
	spisanie();
	batchHide();
	otkudaUznal();
}

//фильтр: дата доставки
function dostavkaDate() {
	const $group = getFilterGroup('дата доставки');
	if (!$group) return;

	const $cont = $('<div class="additonalFilters"></div>');

	$cont.append(makeLink(dates.yesterday));
	$cont.append(makeLink(dates.today));
	$cont.append(makeLink(dates.today, dates.tomorrow));
	$cont.append(makeLink(dates.tomorrow));
	$cont.append(makeLink(dates.tomtomorrow));

	$group.append($cont);

	//создает ссылку для фильтра по дате
	function makeLink(date1, date2 = date1) {
		const title = getTitle(date1, date2);
		return $(`<a class="filterDate" href="${buildUrl({ from: date1.str, to: date2.str })}">${title}</a>`);
	}

	//формирует заголовок для ссылки фильтра
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
	const $group = getFilterGroup('Дата оформления заказа');
	if (!$group) return;

	$group.append(`<div class="additonalFilters">
		<a class="filterDate" href="${buildUrl({ from: dates.today.str })}">${dates.today.title}</a>
		<a class="filterDate" href="${buildUrl({ from: dates.yesterday.str })}">${dates.yesterday.title}</a>
		</div>`);
}

//фильтр: списание
function spisanie() {
	const $group = getFilterGroup('покупатель');
	if (!$group) return;

	const $cont = $('<div class="additonalFilters"></div>');
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
		`<a class="filterDate" href="${buildUrl({
			from: date.from,
			to: date.to,
			customer: 'Списание',
			sort: 'created_at',
			direction: 'desc'
		})}">${date.title}</a>`
	).join('');

	$cont.append(links);
	$group.append($cont);

	//получает дату для фильтра списания с учетом смещения месяцев
	function getMonthDate(offset) {
		const date = new Date();
		date.setMonth(date.getMonth() + offset, 2); // Ставим 2-е число
		return dates.create(date);
	}
}

//показывать/скрывать сервисные заказы
function batchHide() {
	createToggleButton('Технические заказы', () => {
		$('tr.batchHide').toggle();
	});
}

//показывать/скрывать откуда узнал
function otkudaUznal() {
	createToggleButton('Откуда узнал', () => {
		$('[type*="узнал о нас"]').toggle();
		$('.js-order-list th:last').toggle();
	});
}

//создает кнопку-переключатель в футере фильтров
function createToggleButton(text, callback) {
	return $(`<div class="additonalFilters inFooter"><a>${text}</a></div>`)
		.insertAfter($('.m-filter .parameters'))
		.on('click', e => {
			e.preventDefault();
			callback();
		});
}

//находит группу фильтров по названию
function getFilterGroup(name) {
	const $filterGroups = $('.default-form-filter .filter-group').filter((_, group) =>
		$(group).find('.control-label span').text().trim().toLowerCase() === name.trim().toLowerCase()
	);
	return $filterGroups.length ? $filterGroups.eq(0) : null;
}

//формирует URL с параметрами фильтрации
function buildUrl(options) {
	const {
		from,
		to,
		customer = '',
		sort = 'delivery_time_string',
		direction = 'asc'
	} = options;

	const params = new URLSearchParams();

	if (from && to) {
		params.set('filter[deliveryDateFrom][abs]', from);
		params.set('filter[deliveryDateTo][abs]', to);
	} else if (from) {
		params.set('filter[deliveryDateFrom][abs]', from);
		params.set('filter[deliveryDateTo][abs]', from);
	} else if (to) {
		params.set('filter[deliveryDateFrom][abs]', to);
		params.set('filter[deliveryDateTo][abs]', to);
	}

	if (customer) {
		params.set('filter[customer]', customer);
	}

	params.set('filter[sort]', sort);
	params.set('filter[direction]', direction);

	return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}