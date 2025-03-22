import order from '@modules/orders/row';
import finances from '@modules/orders/table/finances';
import { copy } from '@helpers/clipboard';
import retailcrm from '@helpers/retailcrm_direct';
import db from '@helpers/db';
import dom from '@helpers/dom';
import normalize from '@helpers/normalize';
import '@css/orders_table.css';

export let shops = [];
export let indexes = {};
export let noFlowers = [];
export default async () => {
	indexes = getIndexes();
	shops = await getShops();
	noFlowers = await getProductsNoFlowers();

	initHiddenCols();
	listen();
	await orders();
	finances();
	couriersSvodka();
	handleThs();
}

const tableSelector = '.js-order-list';
const hiddenColumns = [
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
];

async function listen() {
	const table = getTable()[0];
	dom.watcher().setSelector('tbody').setTarget(table).setCallback((node) => orders($(node))).start();
	dom.watcher().setSelector('tbody').setTarget(table).setCallback(couriersSvodka).setOnce().start();
}

async function orders($trs = getTrs()) {
	if (!$trs.length) return;

	const ordersCrm = await getOrdersCrm($trs);
	$trs.each(function (i, tr) {
		const $tr = $(tr);
		hiddenCols($tr);
		wrapNative($tr);
		order($tr, ordersCrm[i]);
	});
}

function initHiddenCols() {
	hiddenCols(getThs());
}

function hiddenCols($nodes = getTrs()) {
	if (!$nodes.length) return;

	hiddenColumns.forEach(title => {
		const colIndex = indexes[title.toLowerCase()];
		if (colIndex === undefined) return;

		if ($nodes.is('th')) {
			$nodes.eq(colIndex).hide();
		} else {
			$nodes.children(`:eq(${colIndex})`).hide();
		}
	});
}

function wrapNative($nodes = getTrs()) {
	if (!$nodes.length) return;
	$nodes.find('td').each((_, e) => {
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
		.on('click', () => copy(generate(aggregate())));

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
		let output = '';
		output += from && to ? `с ${from} по ${to}` : from ? `за ${from}` : '';
		output += '\n-------\n';
		output += data.map(c => `${c.name}${c.comments ? ` (${c.comments})` : ''}${c.phone ? ` / ${c.phone}` : ''}${c.bank ? ` (${c.bank})` : ''} / ${c.price} ₽`).join('\n');
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
	return await db.table('shops').get();
}
async function getProductsNoFlowers() {
	return await retailcrm.get.products.noFlowers();
}
async function getOrdersCrm(trs) {
	const ordersCrmIds = $.map(trs, $tr => normalize.int($($tr).find('[href^="/order"]').text()));
	const ordersCrm = await retailcrm.get.orders({ filter: { ids: ordersCrmIds } });
	return ordersCrm;
}