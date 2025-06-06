import { iconsSVG } from '@src/mappings';
import copyBtn from '@helpers/clipboard';
import Reply from '@modules/orders/reply';
import OrdersTd from '@modules/orders/td';
import wait from '@helpers/wait';

export default class ZakazchikTd extends OrdersTd {
	static columnName = 'zakazchikName';

	init() {
		this.onanim();
		this.telegram();
		this.phone();
		this.telegramReply();
	}

	// помечает ячейку, если клиент анонимный
	onanim() {
		if (!this.crm.customFields.onanim) return;
		this.td.addClass('addComment onanim');
	}

	// добавляет ссылку на телеграм заказчика
	telegram() {
		if (!this.crm.contact.customFields.telegram) return;

		const c = this.crm.customer;
		const telegram = c.customFields.telegram;
		const name = [c.firstName, c.patronymic, c.lastName].filter(Boolean).join(' ');
		const icon = iconsSVG.telegram;
		const a = `<a href="https://t.me/${telegram}" title="${telegram}" target="blank" class="telegram">${icon}${name}</a>`;
		this.td.html(a);
	}

	// добавляет телефон заказчика с копированием в буфер при клике
	phone() {
		const tel = this.crm.phone;
		if (!tel) return;
		copyBtn(tel).addClass('phoneZakazchika smallText').lastTo(this.td);
	}

	// добавляет сообщение для заказчика
	async telegramReply() {
		if (this.tr.isBatchHide) return;
		const output = new Reply(this.crm).init();
		copyBtn(output, '').lastTo(this.td);
	}
}
OrdersTd.registerClass(ZakazchikTd);