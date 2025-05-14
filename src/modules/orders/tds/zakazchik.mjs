import * as cols from '@modules/orders/cols';
import { iconsSVG } from '@src/mappings';
import copyBtn from '@helpers/clipboard';
import Reply from '@modules/orders/reply';
import OrderTd from '@modules/orders/td';
import wait from '@helpers/wait';

export default class ZakazchikTd extends OrderTd {
	static columnName = 'zakazchikName';

	constructor(row) {
		super(row);
		this.reply = null;
	}

	init() {
		this.onanim();
		this.telegram();
		this.phone();
		this.telegramReply();
	}

	// помечает ячейку, если клиент анонимный
	onanim() {
		if (!this.row.get(cols.onanim)) return;
		this.$td.addClass('addComment onanim');
	}

	// добавляет ссылку на телеграм заказчика
	telegram() {
		const telegram = this.row.get(cols.telegram);
		if (!telegram) return;
		const name = this.row.get(cols.zakazchikName);
		const icon = iconsSVG.telegram;
		const a = `<a href="https://t.me/${telegram}" title="${telegram}" target="blank" class="telegram">${icon}${name}</a>`;
		this.$native.html(a);
	}

	// добавляет телефон заказчика с копированием в буфер при клике
	phone() {
		const tel = this.row.get(cols.zakazchikPhone);
		if (!tel) return;

		copyBtn($(`<span>${tel}</span>`)).addClass('phoneZakazchika').appendTo(this.$td);
	}

	// добавляет сообщение для заказчика
	async telegramReply() {
		if (this.row.isFakeCustomer || this.row.isDonat || this.row.isDone || !this.row) return;
		await wait.check(() => this.row?.$td(cols.products).find('.name').length);

		this.reply = new Reply(this.row);
		const output = this.reply.init();
		copyBtn(output).appendTo(this.$td);
	}
}

