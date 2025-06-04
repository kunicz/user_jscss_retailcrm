import RootClass from '@helpers/root_class';
import dom from '@helpers/dom';
import { php2steblya as api } from '@helpers/api';

export default class Allowness extends RootClass {
	constructor() {
		super();
		this.ths = dom('.modern-table th');
		this.trs = dom('.modern-table tr[data-url]');
		this.indexes = {};
	}

	async init() {
		this.defineIndexes();
		if (!('id' in this.indexes) || !('shop' in this.indexes) || !('allowness' in this.indexes)) return;

		this.renameAndHideColumns();
		const productData = this.collectProductData();

		const availabilityData = await this.fetchAvailabilityData(productData);
		this.addAvailabilitySelects(availabilityData);
	}

	// определяет по индексам нужные столбцы
	defineIndexes() {
		this.ths.forEach((th, index) => {
			switch (th.txt()) {
				case 'Производитель':
					this.indexes.allowness = index;
					break;
				case 'Внешний ID':
					this.indexes.id = index;
					break;
				case 'Название':
					this.indexes.title = index;
					break;
				case 'Магазин':
					this.indexes.shop = index;
					break;
			}
		});
	}

	// переименовывает и скрывает столбцы
	renameAndHideColumns() {
		this.ths[this.indexes.allowness].node('a').txt('Доступность');
		this.ths[this.indexes.id].hide();
		this.trs.forEach(el => el.nodes('td')[this.indexes.id].hide());
	}

	// собирает данные о товарах, для которых надо получить доступность из БД
	collectProductData() {
		let data = { ids: [], shops: [] };
		this.trs.forEach(el => {
			if (!el.node('td:first-child').child()) return;
			const tds = el.nodes('td');
			if (!tds[this.indexes.id]?.txt() || !tds[this.indexes.shop]?.txt()) return;
			data.ids.push(tds[this.indexes.id].txt());
			data.shops.push(tds[this.indexes.shop].txt());
		});
		return data;
	}

	// получает доступность из БД
	async fetchAvailabilityData(data) {
		const apiResponse = await api('db', 'products/getAllownessByIds').post(data);
		return apiResponse || {};
	}

	// добавляет выпадающий список доступности для каждого товара
	addAvailabilitySelects(data) {
		this.trs.forEach(tr => {
			const tds = tr.nodes('td');
			const d = data.filter(d => d.id == tds[this.indexes.id].txt())[0];
			if (!d) return;

			const allowedToday = d.allowed_today;
			const select = dom(`<select data-shop="${tds[this.indexes.shop].txt()}" data-id="${d.id}">`);
			select
				.toLast(`<option value="1" ${allowedToday == 1 ? 'selected' : ''}>сегодня</option>`)
				.toLast(`<option value="0" ${allowedToday == 0 ? 'selected' : ''}>завтра</option>`)
				.toLast(`<option value="-1" ${allowedToday == -1 ? 'selected' : ''}>никогда</option>`);
			select.listen('click', (e) => e.stopPropagation());
			select.listen('change', async () => {
				const apiResponse = await api('db', 'products/setAllownessById', true).post({
					id: select.data('id'),
					shop: select.data('shop'),
					allowed_today: select.val()
				});
			});
			tds[this.indexes.allowness].empty().toLast(select);
		});
	}
} 