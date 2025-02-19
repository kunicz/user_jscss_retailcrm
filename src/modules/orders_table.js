import { order } from './orders_order';
import { ctrlc, retailcrm, db, cache } from '@helpers';
import { user } from '../index';
import '../css/orders_table.css';

export let shops = cache();
export let indexes = cache(); //индексы ячеек
export let noFlowers = cache();

export async function ordersTable() {
	indexes.set(getIndexes());
	shops.set(await getShops());
	noFlowers.set(await getProductsNoFlowers());

	hiddenCols();
	orders();
	listen();
	total();
	couriersSvodka();
	handleThs();
}

function listen() {
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
	trs.each(function () {
		const $row = $(this);
		hiddenCols($row);
		wrapInnerContentOfTds($row);
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
		'Пометить для флориста и/или администратора'
	]
		.forEach(title => {
			const colIndex = indexes.get()[title.toLowerCase()];
			if (colIndex === undefined) return;
			getThs().eq(colIndex).hide();
			nodes.children(`:eq(${colIndex})`).hide();
		});
}

function wrapInnerContentOfTds(nodes = getTrs()) {
	nodes.find('td').each((_, e) => {
		const $e = $(e);
		$e.html(`<span class="native">${$e.html()}</span>`);
	});
}

function handleThs() {
	getThs().eq(indexes.get()['магазин']).html('');
	getThs().eq(indexes.get()['чат']).children('a').text('Комментарии');
}

/**
 * скрываем финансовую информацию от неадминов
 */
function total() {
	if (!user.get()?.isAdmin) {
		$('#list-total-margin,#list-total-summ').hide();
	}
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
async function getShops() {
	return await db.request({ request: 'shops/get' });
}
async function getProductsNoFlowers() {
	return await retailcrm.get.products.noFlowers();
}