import copyBtn from '@helpers/clipboard';
import OrdersTd from '@modules/orders/td';
import { inlineTooltip } from '@src/helpers';

export default class AdresTd extends OrdersTd {
	static columnName = 'adres';

	init() {
		this.phone();
		this.address();
	}

	// добавляет телефон получателя с копированием в буфер при клике
	phone() {
		if (!this.crm.customFields.phone_poluchatelya) return;

		const phone = this.crm.customFields.phone_poluchatelya;
		const name = this.crm.customFields.name_poluchatelya;
		const btn = copyBtn(phone, '');
		btn.lastTo(this.td);
		inlineTooltip(btn, phone + (name ? ` / ${name}` : ''));
	}

	// форматирует адрес
	address() {
		if (!this.crm.delivery.address.text) return;
		const adrs = this.crm.delivery.address;
		let html = ''
		if (adrs.metro) html += 'м. ' + adrs.metro + ',<br>';
		html += '<a class="yadres">'
			+ [
				adrs.city,
				adrs.street,
				adrs.building ? 'д.' + adrs.building : null,
				adrs.housing ? 'корп.' + adrs.housing : null,
				adrs.house ? 'стр.' + adrs.house : null,
			].filter(Boolean).join(', ')
			+ '</a>';
		if (adrs.block) html += ', под.' + adrs.block;
		if (adrs.flat) html += ', кв/оф.' + adrs.flat;
		if (adrs.floor) html += ', эт.' + adrs.floor;
		this.td.html(html);
		copyBtn(this.td.node('.yadres'));
	}
}
OrdersTd.registerClass(AdresTd);