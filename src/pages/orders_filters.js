import '../css/orders_filters.css';
import { makeDateFromToday, makeDateFromDate } from '../helpers';

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
	for (var i = -1; i <= 2; i++) {
		if (i == 1) cont.append(makeLink(makeDateFromToday(0), makeDateFromToday(1)));
		cont.append(makeLink(makeDateFromToday(i)));
	}
	group.append(cont);

	function makeLink(date1, date2 = null) {
		let title;
		if (!date2) {
			date2 = date1;
			title = `${date1.dd}.${date1.mm}`;
			if (date1.d == date1.today_d) title = 'сегодня';
			if (date1.d - date1.today_d == 1) title = 'завтра';
		} else {
			title = `${date1.dd}-${date2.dd}`;
		}
		return $(`<a class="filterDate" href="${window.location.origin}${window.location.pathname}?filter%5BdeliveryDateFrom%5D%5Babs%5D=${date1.str}&filter%5BdeliveryDateTo%5D%5Babs%5D=${date2.str}&filter%5Bsort%5D=delivery_time_string&filter%5Bdirection%5D=asc">${title}</a>`);
	}
}

//фильтр: дата заказа
function orderDate() {
	const group = getFilterGroup('Дата оформления заказа');
	if (!group) return;
	const cont = $('<div class="additonalFilters"></div>');
	const dates = {
		сегодня: makeDateFromToday(),
		вчера: makeDateFromToday(- 1)
	}
	Object.entries(dates).forEach(([title, date]) => {
		cont.append(`<a class="filterDate" href="${window.location.origin}${window.location.pathname}?filter%5BcreatedAtFrom%5D%5Babs%5D=${date.str}&filter%5BcreatedAtTo%5D%5Babs%5D=${date.str}&filter%5Bsort%5D=delivery_time_string&filter%5Bdirection%5D=asc">${title}</a>`);
	});
	group.append(cont);
}

//филльтр: списание
function spisanie() {
	const group = getFilterGroup('покупатель');
	if (!group) return;
	const cont = $('<div class="additonalFilters"></div>');
	let thisMonth = new Date(); thisMonth.setDate(2);
	let prevMonth = new Date(); prevMonth.setDate(2); prevMonth.setMonth(prevMonth.getMonth() - 1);
	let nextMonth = new Date(); nextMonth.setDate(2); nextMonth.setMonth(thisMonth.getMonth() + 1);
	thisMonth = makeDateFromDate(thisMonth);
	prevMonth = makeDateFromDate(prevMonth);
	nextMonth = makeDateFromDate(nextMonth);
	const dates = [
		{
			title: `cписание (${thisMonth.month})`,
			from: thisMonth.str,
			to: nextMonth.str
		},
		{
			title: `cписание (${prevMonth.month})`,
			from: prevMonth.str,
			to: thisMonth.str
		}
	];
	dates.forEach(date => {
		cont.append(`<a class="filterDate" href="${window.location.origin}${window.location.pathname}?filter%5Bcustomer%5D=Списание&filter%5BdeliveryDateFrom%5D%5Babs%5D=${date.from}&filter%5BdeliveryDateTo%5D%5Babs%5D=${date.to}&filter%5Bsort%5D=created_at&filter%5Bdirection%5D=desc">${date.title}</a>`);
	});
	group.append(cont);
}

//показывать/скрывать сервисные заказы
function batchHide() {
	$('<div class="additonalFilters inFooter"><a>Технические заказы</a></div>').insertAfter($('.m-filter .parameters')).on('click', e => {
		e.preventDefault();
		$('tr.batchHide').toggle();
	});
}

//показывать/скрывать откудв узнал
function otkudaUznal() {
	$('<div class="additonalFilters inFooter"><a>Откуда узнал</a></div>').insertAfter($('.m-filter .parameters')).on('click', e => {
		e.preventDefault();
		$('[type*="узнал о нас"]').toggle();
		$('.js-order-list th:last').toggle();
	});
}

function getFilterGroup(name) {
	let filterGroups = $('.default-form-filter .filter-group');
	if (!filterGroups.length) return null;
	filterGroups = filterGroups.filter(function () {
		return $(this).find('.control-label span').text().trim().toLowerCase() == name.toLowerCase();
	});
	if (!filterGroups.length) return null;
	return filterGroups.eq(0);
}