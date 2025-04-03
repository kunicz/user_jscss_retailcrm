import * as cols from '@modules/orders/cols';
import OrderTd from '@modules/orders/td';
import { iconsSVG } from '@src/mappings';
import dates from '@helpers/dates';
import copyBtn from '@helpers/clipboard';
import { inlineTooltip } from '@src/helpers';
import retailcrm from '@helpers/retailcrm_direct';
import normalize from '@helpers/normalize';

export default class CourierTd extends OrderTd {
	static columnName = 'courier';

	constructor(row) {
		super(row);
		this.$warn = null;
	}

	init() {
		this.auto();
		if (this.isSamovyvoz()) return;
		if (this.row.isDone()) return;
		this.price();
		this.orderInfo();
		this.svodka();
		this.warning();
		this.notifyIndicator();
	}

	isSamovyvoz() {
		if (this.row.get(cols.deliveryType) == 'Самовывоз') {
			this.$native.text('Самовывоз');
			return true;
		}
		return false;
	}

	price() {
		this.$td.append(`<div class="price">${this.row.get(cols.deliverySelfPrice) || ''}</div>`);
	}

	auto() {
		if (!this.row.get(cols.courierAuto)) return;
		this.$td.prepend(`${iconsSVG.auto_courier}<br>`);
	}

	orderInfo() {
		if (this.row.get(cols.adres)) {
			copyBtn(this.getData(false)).appendTo(this.$td);
			if (this.getNative()) {
				const $a = $(`<a href="">${this.getNative()}</a>`);
				copyBtn(this.getData(true), $a);
				this.$td.find('.native').html($a);
			}
		}
	}

	getData(full = false) {
		const m = this.row.get(cols.date).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
		const deliveryDate = dates.create(new Date(m[3], m[2] - 1, m[1]));
		const auto = this.row.get(cols.courierAuto);
		const adres = this.row.getNative(cols.adres);
		const time = this.row.get(cols.time);
		const price = this.row.get(cols.deliverySelfPrice);
		const comment = this.row.get(cols.commentsCourier);
		const phone = this.row.get(cols.poluchatelPhone);
		const name = this.row.get(cols.poluchatelName);

		let output = '';
		if (deliveryDate.isToday || deliveryDate.daysTo <= 2) {
			output += `${deliveryDate.title} (${deliveryDate.strRu})`;
		} else {
			output += deliveryDate.strRu;
		}
		output += ` ${time}`;
		if (auto) output += `\nДоставка на своем автомобиле или на такси!`;
		if (adres) output += '\n' + (!full ? adres.replace(/(,\s(?:кв|эт|под)\..+$)/, '') : adres);
		if (full) {
			if (comment) output += ` ${comment}`;
			if (phone) output += `\n${phone}`;
			if (phone && name) output += ` / ${name}`;
		}
		if (price) output += `\n${price}`;

		return output;
	}

	svodka() {
		const name = this.getNative();
		const price = normalize.int(this.row.get(cols.deliverySelfPrice));
		const phone = normalize.phone(this.row.getNative(cols.courierPhone));
		if (!name || !price) return;

		let data = { name, price, phone };
		if (name == 'Другой курьер') {
			data.comments = this.row.get(cols.commentsCourier);
		}
		const description = this.row.getNative(cols.courierInfo);
		if (description) {
			try {
				data = { ...data, ...JSON.parse(description) }
			} catch (e) { }
		}
		this.$td.data('svodka', data);
	}

	notifyIndicator() {
		if (!this.needNotify()) return;

		const status = this.orderCrm.customFields.courier_notified;
		const $btn = $(`<div class="notify ${status ? 'complete' : 'cancel'}"></div>`);

		$btn.appendTo(this.$warn);
		this.$td.attr('data-notified', String(status));
		if (this.$td.data('notified')) return;

		$btn.on('click', async (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.orderCrm.customFields.courier_notified = true;
			await retailcrm.edit.order(this.orderCrm.id, this.row.shopDb?.shop_crm_code, { customFields: { courier_notified: true } });
			this.$td.attr('data-notified', 'true');
			if (this.$warn.find('.inline-tooltip').text().trim() === 'курьер не уведомлен') this.$warn.hide();
		});
	}

	warning() {
		if (
			this.row.isFakeCustomer() ||
			this.row.hasDonat() ||
			this.row.$tr.is('.batchHide') ||
			this.row.get(cols.deliveryType) != 'Доставка курьером'
		) return;

		const data = {
			'дата доставки': this.row.get(cols.date),
			'время доставки': this.row.get(cols.time),
			'имя получателя': this.row.get(cols.poluchatelName),
			'телефон получателя': this.row.get(cols.poluchatelPhone),
			'адрес доставки': this.row.getNative(cols.adres),
			'стоимость доставки': this.row.get(cols.deliverySelfPrice),
			'курьер не уведомлен': this.needNotify() ? null : 'dont-need'
		}
		const warningCases = [];
		for (const [key, value] of Object.entries(data)) {
			if (!value) warningCases.push(key);
		}
		if (!warningCases.length) return;

		const $warnIcon = $(iconsSVG.warning);
		this.$warn = $('<div class="warn"></div>');
		this.$td.append(this.$warn);
		this.$warn.prepend($warnIcon);
		inlineTooltip($warnIcon, warningCases.join('<br>'));
	}

	needNotify() {
		if (
			['Выполнен', 'Разобран'].includes(this.row.get(cols.status)) ||
			this.row.isFakeCustomer() ||
			this.row.hasDonat() ||
			!this.orderCrm.delivery.data.id ||
			this.orderCrm.customFields.courier_notified
		) return false;
		return true;
	}
}
