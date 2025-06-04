import * as cols from '@modules/orders/cols';
import copyBtn from '@helpers/clipboard';
import { inlineTooltip } from '@src/helpers';
import adres from '@modules/order/adres';
import OrderTd from '@modules/orders/td';

export default class AdresTd extends OrderTd {
	static columnName = 'adres';

	constructor(row) {
		super(row);
	}

	init() {
		this.phone();
		this.address();
	}

	// добавляет телефон получателя с копированием в буфер при клике
	phone() {
		const phone = this.row.get(cols.poluchatelPhone);
		if (!phone) return;

		const name = this.row.get(cols.poluchatelName);
		const $copyBtn = copyBtn(phone, '');
		$copyBtn.lastTo(this.$td);
		inlineTooltip($copyBtn, phone + (name ? ` / ${name}` : ''));
	}

	// форматирует адрес
	address() {
		const rawAddress = this.row.getNative(cols.adres);
		if (!rawAddress) return;

		const formattedAddress = this.formatAddress(rawAddress);
		const clickableAddress = this.makeAddressClickable(formattedAddress);
		const finalAddress = this.formatMetro(clickableAddress);
		this.$native.html(finalAddress);

		const $yadres = this.$td.find('.yadres');
		if ($yadres.length) copyBtn($yadres);
	}

	// форматирует адрес
	formatAddress(address) {
		return address
			.replace(/\s{2,}/, '')
			.replace(/(Москва город, |г\. Москва, )/, '')
			.replace(/^\d+,\s/, '');
	}

	// выделяет часть адреса для клика (для поиска на карте)
	makeAddressClickable(address) {
		const parts = adres.parts.map(i => i[0]).join('|');
		const pattern = `(^.*(?:${parts})\\.\\s(?:[^,])+,\\sд\\.\\s(?:[^,])+(?:,\\s(?:корп\\.|стр\\.)\\s[^,]+)*)`;
		const addressRegex = new RegExp(pattern);
		return address.replace(addressRegex, '<a class="yadres">$1</a>');
	}

	// форматирует метро
	formatMetro(address) {
		return address.replace(/(.+)(?:,\sметро\s(.+))/, 'м. $2<br>$1');
	}
}
