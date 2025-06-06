import OrdersTd from '@modules/orders/td';
import { iconsSVG } from '@src/mappings';
import dates from '@helpers/dates';
import { space } from '@helpers/text';
import copyBtn from '@helpers/clipboard';
import { inlineTooltip } from '@src/helpers';
import retailcrm from '@helpers/retailcrm_direct';
import dom from '@helpers/dom';

export default class CourierTd extends OrdersTd {
	static columnName = 'courier';

	constructor(td) {
		super(td);
		const d = this.crm.delivery;
		const cd = d.data;
		const cf = this.crm.customFields;
		const c = this.crm.customer;
		this.code = d.code;
		this.date = dates.create(new Date(d.date));
		this.isAuto = !!cf?.auto_courier;
		this.metro = d.address?.metro;
		this.adres = d.address?.text;
		this.yadres = this.adres ? (this.metro ? `м. ${this.metro}\n` : '') + this.tr.node('.yadres').txt() : null;
		this.domofon = cf?.domofon;
		this.timeFrom = d.time?.from;
		this.timeTo = d.time?.to;
		this.time = this.timeFrom === this.timeTo ? this.timeFrom : `с ${this.timeFrom} до ${this.timeTo}`;
		this.cost = d.cost;
		this.netCost = d.netCost;
		this.comment = this.crm?.customerComment?.replace(/(\r?\n|\r){2,}/g, '\n');
		this.phoneP = cf?.phone_poluchatelya;
		this.nameP = cf?.name_poluchatelya;
		this.phoneZ = this.crm?.phone;
		this.nameZ = [c.firstName, c.patronymic, c.lastName].filter(Boolean).join(' ');
		this.courierId = cd?.id;
		this.courierName = [cd?.firstName, cd?.lastName].filter(Boolean).join(' ');
		this.courierPhone = cd?.phone?.number;
		this.courierDescription = cf?.courier_description ? JSON.parse(cf.courier_description) : null;
		this.courierBank = this.courierDescription?.bank;
		this.courierComments = this.courierDescription?.comments;
		this.isNotified = cf?.courier_notified;
	}

	init() {
		this.auto();

		if (this.isSamovyvoz()) return;

		this.price();
		this.svodka();
		this.orderInfo();

		if (this.tr.isDone) return;

		this.warning();
		this.notifyIndicator();
	}

	// если самовывоз
	isSamovyvoz() {
		if (this.code == 'self-delivery') {
			this.td.child('.native').txt('Самовывоз');
			return true;
		}
		return false;
	}

	// стоимость доставки
	price() {
		this.td.toLast(`<div class="price">${this.netCost} руб.</div>`);
		if (this.netCost === this.cost) return;
		const text = (this.cost > this.netCost ? 'экономия' : 'расход') + ': ' + space.strNbspStr(`${Math.abs(this.cost - this.netCost)} руб.`);
		const smallText = dom(`<div class="smallText"></div>`);
		smallText.html(text).lastTo(this.td);
	}

	// курьер на авто
	auto() {
		if (!this.isAuto) return;
		const icon = dom(iconsSVG.auto_courier);
		icon.firstTo(this.td).toNext('<br>');
	}

	// кнопки с данными для поиска курьера и для найденного курьера
	orderInfo() {
		if (!this.adres) return;
		copyBtn(this.getData(false), '').lastTo(this.td); // для поиска курьера
		if (!this.courierId) return;
		if (!this.td.child('.native a')) this.td.child('.native').html(`<a>${this.td.child('.native').txt()}</a>`)
		copyBtn(this.getData(true), this.td.child('.native')); // для найденного курьера
	}

	// собирает текст для кнопок
	getData(full = false) {
		let output = '';
		//дата
		output += this.date?.isToday || this.date?.daysTo <= 2 ? `${this.date?.title} (${this.date?.strRu})` : this.date?.strRu;
		//время
		output += ` ${this.time}`;
		//авто
		if (this.isAuto) output += `\nДоставка на своем автомобиле или на такси!`;
		//адрес
		if (this.adres) output += `\n${full ? this.adres : this.yadres}`;
		//домофон
		if (this.domofon && full) output += `, код домофона: ${this.domofon}`;
		//для курьера
		if (full) {
			if (this.comment) output += `\n${this.comment}`; // комментарий к заказу
			if (this.phoneP && this.phoneP !== this.phoneZ) output += `\nПолучатель:`;
			if (this.phoneP) output += `\n${this.phoneP}`; // телефон получателя
			if (this.phoneP && this.nameP) output += ` / ${this.nameP}`; // имя получателя
			if (this.phoneP && this.phoneP !== this.phoneZ) output += ' (сначала пробуем дозвониться сюда)';
			if (this.phoneZ !== this.phoneP) {
				if (this.phoneZ && this.phoneP) output += `\nЕсли получатель не отвечает:`;
				if (this.phoneZ) output += `\n${this.phoneZ}`; // телефон заказчика
				if (this.phoneZ && this.nameZ) output += ` / ${this.nameZ}`; // имя заказчика
				if (this.phoneZ) output += ' (заказчик)';
			}
		}
		//цена
		if (this.netCost) output += `\n${this.netCost} руб.`;

		return output;
	}

	// собирает информацию о доставке
	// и кладет ее в data-атрибут td
	// там ее подберет модуль couriersSvodka.mjs
	svodka() {
		if (!this.courierName || !this.netCost) return;
		this.td.data('svodka', {
			name: this.courierName,
			price: this.netCost,
			phone: this.courierPhone,
			bank: this.courierBank,
			comments: this.courierName === 'Другой курьер' ? this.crm?.managerComment : this.courierComments
		});
	}

	// создает предупреждение о доставке
	warning() {
		if (
			this.tr.isBatchHide || // заказ не "неинтересный"
			this.code != 'courier' // заказ не на курьера
		) return;

		const data = {
			'дата доставки': this.date,
			'время доставки': this.time,
			'имя получателя': this.nameP,
			'телефон получателя': this.phoneP,
			'адрес доставки': this.adres,
			'стоимость доставки': this.netCost,
			'курьер не уведомлен': this.needNotify() ? null : 'dont-need'
		}
		const warningCases = [];
		for (const [key, value] of Object.entries(data)) if (!value) warningCases.push(key);
		if (!warningCases.length) return;

		const warnIcon = dom(iconsSVG.warning);
		const warnCont = dom('<div class="warn"></div>');
		warnCont.toLast(warnIcon).lastTo(this.td);
		inlineTooltip(warnIcon, warningCases.join('<br>'));
	}

	// показывает колокольчик
	// для уведомления курьера о доставке
	notifyIndicator() {
		if (!this.needNotify()) return;

		const btn = dom(`<div class="notify ${this.isNotified ? 'complete' : 'cancel'}" title="курьер оповещен"></div>`);
		const warn = this.td.child('.warn');

		btn.lastTo(warn);
		this.td.attr('data-notified', String(this.isNotified));
		if (this.td.data('notified')) return;

		btn.listen('click', async (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.crm.customFields.courier_notified = true;
			await retailcrm.edit.order(this.crm.id, this.crm.site, { customFields: { courier_notified: true } });
			this.td.attr('data-notified', 'true');
			if (warn.node('.inline-tooltip').txt() === 'курьер не уведомлен') warn.hide();
		});
	}

	// условия, при которых нужно показывать колокольчик
	needNotify() {
		return !this.tr.isBatchHide && // заказ не "неинтересный"
			this.code === 'courier' && // заказ на курьера
			!this.isNotified; // курьер еще не уведомлен
	}
}
OrdersTd.registerClass(CourierTd);