import RootClass from '@helpers/root_class';
import { indexes } from '@modules/orders/indexes';

export default class OrdersTd extends RootClass {
	static classesTd = new Map();
	static registerClass(cls) {
		if (!cls.columnName) return;
		self.classesTd.set(cls.columnName, cls);
	}
	constructor(td) {
		super();
		this.td = td;
		this.tr = this.td.parent('tr');
		this.crm = this.tr.data('crm');
		this.index = this.td.indexOf('td');
		this.indexData = indexes.filter(i => i.index === this.index)[0];
		this.slug = this.indexData.slug;
		this.title = this.indexData.title;
	}

	// первичная инициализация
	// выполняется базовая логика для всех ячеек
	init() {
		this.td.attr('col', this.slug); // добавляем атрибут col для простого обращения к ячейке
		this.wrapNative(); // оборачиваем оригинальное содержимое ячейки в span с классом native
		const cls = self.classesTd.get(this.slug);
		if (cls) new cls(this.td).init();
	}

	// текст ячейки - корректный cardType, обернутый в span
	wrapNative() {
		this.td.html(`<span class="native">${this.td.html()}</span>`);
	}
}

self = OrdersTd;