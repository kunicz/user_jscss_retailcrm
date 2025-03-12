import order from './orders_order.js';
import finances from './orders_table_finances.js';
import { ctrlc } from '@helpers/clipboard.js';
import retailcrm from '@helpers/retailcrm';
import db from '@helpers/db';
import dom from '@helpers/dom';
import '../css/orders_table.css';

export let shops = [];
export let indexes = {};
export let noFlowers = [];
export default async () => {
	indexes = getIndexes();
	shops = await getShops();
	noFlowers = await getProductsNoFlowers();

	hiddenCols();
	orders();
	listen();
	finances();
	couriersSvodka();
	handleThs();
}

const tableSelector = '.js-order-list';

async function listen() {
	const table = getTable()[0];
	dom.watcher().setSelector('tbody').setTarget(table).setCallback(($node) => orders($node)).start();
	dom.watcher().setSelector('tbody').setTarget(table).setCallback(couriersSvodka).setOnce().start();
}

function orders(trs = getTrs()) {
	trs.each(function () {
		const $row = $(this);
		hiddenCols($row);
		wrapNative($row);
		order($row);
	});
}

function hiddenCols(nodes = getTrs()) {
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
		'Оплачено',
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
		'Сумма по товарам/услугам',
		'Добавить лубрикант Lovix',
		'Пометить для флориста и/или администратора',
		'Курьер оповещен'
	]
		.forEach(title => {
			const colIndex = indexes[title.toLowerCase()];
			if (colIndex === undefined) return;
			getThs().eq(colIndex).hide();
			nodes.children(`:eq(${colIndex})`).hide();
		});
}

function wrapNative(nodes = getTrs()) {
	nodes.find('td').each((_, e) => {
		const $e = $(e);
		$e.html(`<span class="native">${$e.html()}</span>`);
	});
}

function handleThs() {
	getThs().eq(indexes['магазин']).html('');
	getThs().eq(indexes['чат']).children('a').text('Комментарии');
}

function couriersSvodka() {
	$(`<span><a id="couriersSvodka">Сводка по оплате курьерам</a></span>`)
		.appendTo($('#list-total-wrapper'))
		.on('click', () => {
			const summary = generate(aggregate());
			ctrlc(summary);
		});

	function aggregate() {
		const $tds = getTrs().find('td[type="курьер"]');
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
		const from = $('#filter_deliveryDate_gte_abs').val().split('-').reverse().slice(0, 2).join('.');
		const to = $('#filter_deliveryDate_lte_abs').val().split('-').reverse().slice(0, 2).join('.');

		let output = from && to ? `с ${from} по ${to}` : from ? `за ${from}` : '';
		output += '\n-------\n';

		output += data.map(c =>
			`${c.name}${c.comments ? ` (${c.comments})` : ''}${c.phone ? ` / ${c.phone}` : ''}${c.bank ? ` (${c.bank})` : ''} / ${c.price} ₽`
		).join('\n');

		output += `\n-------\n`;
		output += `скопировано в ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

		return output;
	}
}




function getTable() {
	return $(tableSelector);
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
async function getShops() {
	return await db.request({ request: 'shops/get' });
}
async function getProductsNoFlowers() {
	return await retailcrm.get.products.noFlowers();
}