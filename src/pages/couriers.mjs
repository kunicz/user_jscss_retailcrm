import RootClass from '@helpers/root_class';
import dom from '@helpers/dom';
import '@css/couriers.css';

export default class Couriers extends RootClass {
	static name = 'couriers';

	constructor() {
		super();
		this.table = dom('#main').node('.modern-table');
		this.ths = this.table.nodes('thead th');
		this.trs = this.table.nodes('tbody tr');
	}

	init() {
		this.bankCol();
		this.parseDescription();
	}

	// добавляет столбец "банк"
	bankCol() {
		dom('<th>Банк</th>').nextTo(this.ths[3]);
		this.trs.forEach(tr => dom('<td class="bank" />').nextTo(tr.childs('td')[3]));
	}

	// парсит JSON описания курьера и выводит корректно
	parseDescription() {
		this.trs.forEach(tr => {
			const descrTd = tr.child('.courier-text');
			const desctData = descrTd.txt();
			if (!desctData) return;
			const descr = JSON.parse(desctData);
			tr.data('descr', descr);
			for (let key in descr) {
				switch (key) {
					case 'bank':
						tr.child('.bank').txt(descr[key]);
						break;
					case 'comments':
						descrTd.txt(descr[key]);
						break;
				}
			}
		});
	}
}