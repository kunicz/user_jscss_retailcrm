import * as cols from '@modules/orders/cols';
import OrdersTable from '@modules/orders/table';
import { SKU_DONAT } from '@root/config';
import AdresTd from '@modules/orders/tds/adres';
import CardTd from '@modules/orders/tds/card';
import CheckboxTd from '@modules/orders/tds/checkbox';
import CommentsTd from '@modules/orders/tds/comments';
import CourierTd from '@modules/orders/tds/courier';
import ProductsTd from '@modules/orders/tds/products';
import ShopTd from '@modules/orders/tds/shop';
import SummTd from '@modules/orders/tds/summ';
import ZakazchikTd from '@modules/orders/tds/zakazchik';

export default class OrdersRow {
	constructor($tr, orderCrm) {
		this.$tr = $tr;
		this.orderCrm = orderCrm;
		this.fakeCustomers = OrdersTable.fakeCustomers;
		this.indexes = OrdersTable.indexes;
		this.shops = OrdersTable.shops;
		this.shopDb = this.getShop();
	}

	init() {
		this.markCols();
		this.coloredRow();
		this.batchHideRow();
		// импорты для ячеек
		new CheckboxTd(this).init();
		new ShopTd(this).init();
		new ZakazchikTd(this).init();
		new ProductsTd(this).init();
		new CardTd(this).init();
		new CommentsTd(this).init();
		new AdresTd(this).init();
		new SummTd(this).init();
		new CourierTd(this).init();
	}

	// устанавлевает метку с названием колонки в каждой ячейке
	markCols() {
		this.$tr.children('td').each((i, td) => $(td).attr('col', this.indexes[i]));
	}

	// меняет цвет ряда в зависимости от условий
	coloredRow() {
		let color;
		if (this.get(cols.shop) == 'STAY TRUE Flowers') color = 'fffaff';
		if (this.get(cols.zakazchikName) == 'списание') color = 'fff3ee';
		if (this.get(cols.zakazchikName) == 'наличие') color = 'e6fff1';
		if (this.hasDonat()) color = 'ffffe9';
		if (!color) return;
		this.$tr.children().css('background-color', '#' + color);
	}

	// помечает ряд для скрытия в пакетной операции
	batchHideRow() {
		if (
			this.isFakeCustomer() ||
			this.hasDonat() ||
			this.get(cols.status) === 'разобран'
		) this.$tr.addClass('batchHide');
	}

	// проверяет наличие доната в заказе
	hasDonat() {
		if (!this.orderCrm?.items) return false;
		return this.orderCrm.items.some(item => item.offer?.article == SKU_DONAT);
	}

	// проверяет, является ли клиент фейковым
	isFakeCustomer() {
		return this.fakeCustomers.some(customer => customer.id === this.orderCrm.customer.id);
	}

	// проверяет, является ли заказ оконченным
	isDone() {
		return (['Витрина', 'Разобран', 'Отменен'].includes(this.get(cols.status)));
	}

	getShop() {
		return this.shops.find(s => s.shop_title === this.getNative(cols.shop));
	}

	td(title) {
		return this.$tr.children('td').eq(this.indexes[title]);
	}

	get(title) {
		return this.gt(this.td(title));
	}

	getNative(title) {
		return this.gt(this.td(title).children('.native'));
	}

	gt(node) {
		let content = node.clone();
		content.find('.collapsable-text__button').remove();
		content.find('.list-status-comment').remove();
		content.find('br').replaceWith("\n");
		content = content.text().trim();
		const excludedValues = ['—', 'Нет', '0 ₽', ''];
		return excludedValues.includes(content) ? null : content;
	}
}
