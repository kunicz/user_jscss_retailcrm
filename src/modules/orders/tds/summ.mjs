import normalize from '@helpers/normalize';
import OrdersTd from '@modules/orders/td';

export default class SummTd extends OrdersTd {
	static columnName = 'summ';

	init() {
		this.paid();
	}

	paid() {
		let text = 'Оплачено:<br>';
		const paid = normalize.number(this.crm.prepaySum);
		const totalSum = this.crm.totalSum;

		text += paid;
		if (totalSum && totalSum != paid) text += ` из ${totalSum}`;

		this.td.toLast(`<div class="smallText paid">${text}</div>`);
	}
}
OrdersTd.registerClass(SummTd);