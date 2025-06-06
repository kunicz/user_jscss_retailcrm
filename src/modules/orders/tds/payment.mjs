import OrdersTd from '@modules/orders/td';
import { iconsSVG } from '@src/mappings';

export default class PaymentTd extends OrdersTd {
	static columnName = 'payment';

	init() {
		this.highlight();
	}

	// подсвечиваем ячейку, если есть расхождения по деньгам
	highlight() {
		if (this.crm.prepaySum === this.crm.totalSumm) return;
		if (this.crm.prepaySum > this.crm.totalSumm) {
			this.td.addClass('perepaid').attr('title', 'Переплата');
		}
		if (this.crm.prepaySum < this.crm.totalSumm) {
			this.td.addClass('unpaid').attr('title', 'Недоплата');
			this.td.child('.native').html(iconsSVG.paymentWarning);
		}
	}
}
OrdersTd.registerClass(PaymentTd);