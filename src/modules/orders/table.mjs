import OrdersRow from '@modules/orders/tr';
import Finances from '@modules/orders/table/finances';
import CouriersSvodka from '@modules/orders/table/couriers_svodka';
import { hiddenColumns } from '@modules/orders/cols';
import retailcrm from '@helpers/retailcrm_direct';
import db from '@helpers/db';
import observers from '@helpers/observers';
import normalize from '@helpers/normalize';
import '@css/orders_table.css';

export default class OrdersTable {
	static indexes = {};
	static shops = [];
	static noFlowers = [];
	static fakeCustomers = [];
	static $table = null;
	static $ths = [];

	constructor() {
		this.finances = new Finances();
		this.couriersSvodka = new CouriersSvodka();
		this.trs = new Map();
	}

	async init() {
		self.$table = $('.js-order-list');
		self.$ths = self.$table.find('tr:first th');
		self.indexes = self.getIndexes(self.$ths);
		self.shops = await self.getShops();
		self.noFlowers = await self.getProductsNoFlowers();
		self.fakeCustomers = await self.getFakeCustomers();

		this.listen();
		await this.orders(self.$trs());
		this.handleThs();
		this.hiddenCols(self.$ths);
		this.finances.init();
		this.couriersSvodka.init();
		self.$table.addClass('loaded');
	}

	destroy() {
		self.$table = null;
		self.$ths = null;
		this.finances?.destroy?.();
		this.finances = null;
		this.couriersSvodka?.destroy?.();
		this.couriersSvodka = null;
		for (const tr of this.trs.keys()) this.trs.get(tr).destroy();
		this.trs.clear();
		this.trs = null;
	}

	// слушает изменения в таблице
	listen() {
		observers.add('orders', 'trs')
			.setSelector('tbody')
			.setTarget(self.$table)
			.onMutation((node) => this.orders(self.$trs($(node))))
			.start();
	}

	// логика для каждого заказа (ряд таблицы)
	async orders($trs) {
		if (!$trs.length) return;

		const ordersCrm = await self.getOrdersCrm($trs);
		$trs.each((i, tr) => {
			const $tr = $(tr);
			this.hiddenCols($tr);
			this.wrapNative($tr);
			if (this.trs.has(tr)) {
				this.trs.get(tr).init();
			} else {
				const orderRow = new OrdersRow($tr, ordersCrm[i]);
				this.trs.set(tr, orderRow);
				orderRow.init();
			}
		});
	}

	// скрывает колонки в зависимости от условий
	hiddenCols($nodes) {
		if (!$nodes.length) return;

		hiddenColumns.forEach(title => {
			const colIndex = self.indexes[title];
			if (colIndex === undefined) return;

			const $target = $nodes.is('th') ? $nodes : $nodes.children();
			$target.eq(colIndex).hide();
		});
	}

	// настраиваем заголовки колонок
	handleThs() {
		self.$ths.each((i, th) => $(th).attr('col', self.indexes[i]));
		self.$ths.eq(self.indexes['магазин']).html('');
		self.$ths.eq(self.indexes['чат']).children('a').text('Комментарии');
	}

	// оборачивает оригинальное содержимое ячеек в span с классом native
	wrapNative($nodes = self.$trs()) {
		if (!$nodes.length) return;
		$nodes.find('td').each((_, e) => {
			const $e = $(e);
			$e.html(`<span class="native">${$e.html()}</span>`);
		});
	}

	// возвращает все заказы (ряды таблицы)
	static $trs($node = self.$table) {
		return $node.find('tr[data-url*="orders"]');
	}

	// возвращает id заказа
	static getOrderCrmId($tr) {
		return normalize.int($($tr).find('[href^="/order"]').text());
	}

	// возвращает объекты заказов из CRM
	static async getOrdersCrm($trs) {
		const ordersCrmIds = $.map($trs, $tr => self.getOrderCrmId($tr));
		const ordersCrm = await retailcrm.get.orders({ filter: { ids: ordersCrmIds } });
		return ordersCrm.sort((a, b) => {
			const indexA = ordersCrmIds.indexOf(a.id);
			const indexB = ordersCrmIds.indexOf(b.id);
			return indexA - indexB;
		});
	}

	// возвращает индексы колонок
	static getIndexes() {
		const ixs = {};
		self.$ths.each((i, _) => {
			const text = self.$ths.eq(i).text()
				.replace(/\s+/g, ' ')  // заменяем все пробельные символы на один пробел
				.replace(/\n/g, '')    // удаляем переносы строк
				.trim()                // удаляем пробелы в начале и конце
				.toLowerCase();        // приводим к нижнему регистру

			ixs[text] = self.$ths.eq(i).index();
			ixs[self.$ths.eq(i).index()] = text;
		});
		return ixs;
	}

	// возвращает все магазины из бд
	static async getShops() {
		if (self.shops.length) return self.shops;
		const shops = await db.table('shops').get();
		self.shops = shops;
		return shops;
	}

	// возвращает все некаталожные товары нецветы из CRM
	static async getProductsNoFlowers() {
		if (self.noFlowers.length) return self.noFlowers;
		const noFlowers = await retailcrm.get.products.noFlowers();
		self.noFlowers = noFlowers;
		return noFlowers;
	}

	// возвращает все фейковые клиенты из CRM
	static async getFakeCustomers() {
		if (self.fakeCustomers.length) return self.fakeCustomers;
		const fakeCustomers = await retailcrm.get.customers.fake();
		self.fakeCustomers = fakeCustomers;
		return fakeCustomers;
	}
}

const self = OrdersTable;
