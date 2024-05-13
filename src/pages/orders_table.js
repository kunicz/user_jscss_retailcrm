import { Order } from './orders_order';
import { ctrlc } from '../helpers';
import { getProductsNoFlowers } from '../retailcrm';
import '../css/orders_table.css';

//будет использован в классе Order
export let indexes; //индексы ячеек
export let noFlowers; // получаем товары (не цветы) для проверки в составах заказов
export let couriersDataForSvodka = []; //данные курьеров для сводки
export function getNoFlowers() { return noFlowers; }
export function setNoFlowers(data) { noFlowers = data; }
export function getCouriersDataForSvodka() { return couriersDataForSvodka; }
export function setCouriersDataForSvodka(data) { couriersDataForSvodka = data; }

export async function ordersTable() {
	indexes = getIndexes();
	hiddenCols();
	noFlowers = await getProductsNoFlowers();
	orders();
	listenOrders();
	couriersSvodka();
	handleThs();
}

function listenOrders() {
	const observer = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			if (mutation.type !== 'childList') return;
			if (!$(mutation.target).is('tbody')) return;
			orders($(mutation.addedNodes));
			couriersSvodka();
		});
	});
	observer.observe(getTable().get(0), { childList: true, subtree: true });
}

function orders(trs = getTrs()) {
	couriersDataForSvodka = [];
	trs.each((_, e) => {
		hiddenCols($(e));
		wrapInnerContentOfTds($(e));
		new Order($(e));
	});
}

function hiddenCols(nodes = null) {
	[
		'Дата и время',
		'Тип доставки',
		'Телефон получателя',
		'Имя получателя',
		'Себестоимость доставки',
		'Аноним',
		'Текст в карточку',
		'Узнать адрес у получателя',
		'Номер',
		'Метро',
		'Сумма оплаты',
		'Телефон курьера',
		'Примечания курьера',
		'Автокурьер',
		'Расходы на закуп цветка',
		'Расходы на закуп нецветка',
		'Откуда узнал о нас (в заказе)',
		'Мессенджер заказчика (в заказе)',
		'Скидка в процентах',
		'Комментарий оператора',
		'Комментарий клиента',
		'Контактный телефон',
		'Состав',
		'Сумма по товарам',
		'Добавить лубрикант Lovix',
		'Пометить для флориста и/или администратора'
	].forEach(title => {
		if (!nodes) {
			getThs().eq(indexes[title.toLowerCase()]).hide();
			getTrs().each((_, e) => $(e).children().eq(indexes[title.toLowerCase()]).hide());
		} else {
			nodes.each((_, e) => $(e).children().eq(indexes[title.toLowerCase()]).hide());
		}
	});
}

function wrapInnerContentOfTds(nodes = getTrs()) {
	nodes.find('td').each((_, e) => $(e).html(`<span class="native">${$(e).html()}</span>`));
}

function handleThs() {
	getThs().eq(indexes['магазин']).html('');
	getThs().eq(indexes['чат']).children('a').text('Комментарии');
}

function couriersSvodka() {
	//схлопываем доставки для одних и тех же курьеров, чтоб получить общую сумму
	couriersDataForSvodka = couriersDataForSvodka.reduce((acc, curr) => {
		if (curr.name === 'Другой курьер') {
			acc.push({ ...curr });
		} else {
			const existingIndex = acc.findIndex(item => item.name === curr.name);
			if (existingIndex !== -1) {
				acc[existingIndex].price += curr.price;
			} else {
				acc.push({ ...curr });
			}
		}
		return acc;
	}, []);
	//добавляем кнопку
	$(`<span><a id="couriersSvodka">Сводка по оплате курьерам</a></span>`)
		.appendTo($('#list-total-wrapper'))
		.on('click', () => ctrlc(getData()));

	function getData() {
		let output = '';
		const from = $('#filter_deliveryDateFrom_abs').siblings('input:last').val();
		const to = $('#filter_deliveryDateTo_abs').siblings('input:last').val();
		if (from) output += `с ${from} `;
		if (to) output += `по ${to} `;
		if (from == to) output = `за ${from}`;
		output += '\n-------\n';
		if (!from && !to) output = '';
		couriersDataForSvodka.forEach(courier => {
			output += courier.name;
			if (courier.comments) output += ` (${courier.comments})`;
			if (courier.phone) output += ` / ${courier.phone}`;
			if (courier.bank) output += ` (${courier.bank})`;
			output += ` / ${courier.price} ₽`;
			output += '\n';
		});
		const today = new Date();
		output += '-------\n';
		output += `скопировано в ${today.getHours()}:${(today.getMinutes() < 10 ? '0' : '') + today.getMinutes()}`;
		return output;
	}
}


function getTable() {
	return $('.js-order-list');
}
function getTrs() {
	return getTable().find('tr[data-url*="orders"]');
}
function getThs() {
	return getTable().find('tr:first th');
}
function getIndexes() {
	const ixs = {};
	const ths = getThs();
	ths.each(i => {
		ixs[ths.eq(i).text().trim().toLowerCase()] = ths.eq(i).index();
		ixs[ths.eq(i).index()] = ths.eq(i).text().trim().toLowerCase();
	});
	return ixs;
}