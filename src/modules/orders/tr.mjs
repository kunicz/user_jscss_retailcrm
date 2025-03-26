import * as cols from '@modules/orders/cols';
import { indexes, shops, fakeCustomers } from '@modules/orders/table';
import { SKU_DONAT } from '@root/config';
import adres from '@modules/orders/tds/adres';
import card from '@modules/orders/tds/card';
import checkbox from '@modules/orders/tds/checkbox';
import comments from '@modules/orders/tds/comments';
import courier from '@modules/orders/tds/courier';
import products from '@modules/orders/tds/products';
import shop from '@modules/orders/tds/shop';
import summ from '@modules/orders/tds/summ';
import zakazchik from '@modules/orders/tds/zakazchik';

class OrdersRow {
	constructor($tr, orderCrm) {
		this.$tr = $tr;
		this.orderCrm = orderCrm;
		this.shopDb = this.getShop();
	}

	init() {
		this.markCols();
		this.coloredRow();
		this.batchHideRow();
		// импорты дл ячеек
		checkbox(this);
		shop(this);
		zakazchik(this);
		products(this, this.orderCrm);
		card(this, this.orderCrm);
		comments(this);
		adres(this);
		summ(this);
		courier(this, this.orderCrm, this.hasDonat());
	}

	// устанавлевает метку с названием колонки в каждой ячейке
	markCols() {
		this.$tr.children('td').each((i, td) => $(td).attr('col', indexes()[i]));
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
		return fakeCustomers().some(customer => customer.id === this.orderCrm.customer.id);
	}

	// проверяет, является ли заказ оконченным
	isDone() {
		return (['Витрина', 'Разобран', 'Отменен'].includes(this.get(cols.status)));
	}

	getShop() {
		return shops().find(s => s.shop_title === this.getNative(cols.shop));
	}

	td(title) {
		return this.$tr.children('td').eq(indexes()[title]);
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

export default ($tr, order) => new OrdersRow($tr, order).init();