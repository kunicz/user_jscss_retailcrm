import order from '@modules/orders/tr';
import { hiddenColumns } from '@modules/orders/cols';
import finances from '@modules/orders/table/finances';
import couriersSvodka from '@modules/orders/table/couriers_svodka';
import retailcrm from '@helpers/retailcrm_direct';
import db from '@helpers/db';
import observers from '@helpers/observers';
import normalize from '@helpers/normalize';
import '@css/orders_table.css';

class OrdersTable {
	constructor() {
		this.$table = $('.js-order-list');
		this.$ths = this.$table.find('tr:first th');
		this.shops = [];
		this.indexes = {};
		this.noFlowers = [];
		this.fakeCustomers = [];
	}

	async init() {
		await this.getExportData(); // получаем данные для экспорта в дочерние модули
		this.listen();
		await this.orders(this.$trs());
		this.initHiddenCols();
		finances();
		couriersSvodka(this);
		this.$table.addClass('loaded');
	}

	async listen() {
		observers.orders.add('trs')
			.setSelector('tbody')
			.setTarget(this.$table)
			.onMutation((node) => this.orders(this.getTrs($(node))))
			.start();
	}

	async orders($trs) {
		if (!$trs.length) return;

		const ordersCrm = await this.getOrdersCrm($trs);
		$trs.each((i, tr) => {
			const $tr = $(tr);
			this.hiddenCols($tr);
			this.wrapNative($tr);
			order($tr, ordersCrm[i]);
		});
	}

	initHiddenCols() {
		this.handleThs();
		this.hiddenCols();
	}

	hiddenCols($nodes = this.$ths) {
		if (!$nodes.length) return;

		hiddenColumns.forEach(title => {
			const colIndex = this.indexes[title];
			if (colIndex === undefined) return;

			if ($nodes.is('th')) {
				$nodes.eq(colIndex).hide();
			} else {
				$nodes.children(`:eq(${colIndex})`).hide();
			}
		});
	}

	handleThs() {
		this.$ths.each((i, th) => $(th).attr('col', indexes()[i]));
		this.$ths.eq(this.indexes['магазин']).html('');
		this.$ths.eq(this.indexes['чат']).children('a').text('Комментарии');
	}

	wrapNative($nodes = this.$trs()) {
		if (!$nodes.length) return;
		$nodes.find('td').each((_, e) => {
			const $e = $(e);
			$e.html(`<span class="native">${$e.html()}</span>`);
		});
	}

	$trs() {
		return this.getTrs(this.$table);
	}

	getTrs($node) {
		return $node.find('tr[data-url*="orders"]');
	}

	getIndexes() {
		const ixs = {};
		this.$ths.each((i, _) => {
			const text = this.$ths.eq(i).text()
				.replace(/\s+/g, ' ')  // заменяем все пробельные символы на один пробел
				.replace(/\n/g, '')    // удаляем переносы строк
				.trim()                // удаляем пробелы в начале и конце
				.toLowerCase();        // приводим к нижнему регистру

			ixs[text] = this.$ths.eq(i).index();
			ixs[this.$ths.eq(i).index()] = text;
		});
		return ixs;
	}

	async getShops() {
		return await db.table('shops').get();
	}

	async getProductsNoFlowers() {
		return await retailcrm.get.products.noFlowers();
	}

	async getfakeCustomers() {
		return await retailcrm.get.customers.fake();
	}

	getOrderCrmId($tr) {
		return normalize.int($($tr).find('[href^="/order"]').text());
	}

	async getOrdersCrm($trs) {
		const ordersCrmIds = $.map($trs, $tr => this.getOrderCrmId($tr));
		const ordersCrm = await retailcrm.get.orders({ filter: { ids: ordersCrmIds } });
		return ordersCrm.sort((a, b) => {
			const indexA = ordersCrmIds.indexOf(a.id);
			const indexB = ordersCrmIds.indexOf(b.id);
			return indexA - indexB;
		});
	}

	async getExportData() {
		const [shops, noFlowers, fakeCustomers] = await Promise.all([
			this.getShops(),
			this.getProductsNoFlowers(),
			this.getfakeCustomers()
		]);

		this.shops = shops;
		this.noFlowers = noFlowers;
		this.fakeCustomers = fakeCustomers;
		this.indexes = this.getIndexes();
	}
}

let currentInstance = null;

const getInstance = () => {
	if (!currentInstance) currentInstance = new OrdersTable();
	return currentInstance;
};

export default async () => {
	currentInstance = new OrdersTable();
	return currentInstance.init();
};

export const shops = () => getInstance().shops;
export const indexes = () => getInstance().indexes;
export const noFlowers = () => getInstance().noFlowers;
export const fakeCustomers = () => getInstance().fakeCustomers;