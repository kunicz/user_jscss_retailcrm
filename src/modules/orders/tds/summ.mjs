import * as cols from '@modules/orders/cols';
import normalize from '@helpers/normalize';
import OrderTd from '@modules/orders/td';

export default (row) => {
	new SummTd(row).init();
}

class SummTd extends OrderTd {
	static columnName = 'summ';

	constructor(row) {
		super(row);
	}

	init() {
		this.paid();
		this.discount();
	}

	paid() {
		let text = 'Оплачено:<br>';

		const paid = normalize.int(this.row.get(cols.paid));
		text += paid;

		const shouldPayed = this.sumPayments(this.row.get(cols.payments) || '');
		if (shouldPayed && shouldPayed != paid) text += ` из ${shouldPayed}`;

		this.$td.append(`<div class="paid">${text}</div>`);
	}

	sumPayments(text) {
		const amounts = text.match(/\d[\d\s]*₽/g) || []; // Ищем все суммы с ₽
		return amounts.reduce((sum, amount) => {
			const numericValue = normalize.int(amount);
			return sum + (isNaN(numericValue) ? 0 : numericValue);
		}, 0);
	}

	discount() {
		const discount = parseInt(this.row.get(cols.discount) || 0);
		if (discount > 0) {
			this.$td.append(`<div class="discount">${discount}%</div>`);
		}
	}
}

