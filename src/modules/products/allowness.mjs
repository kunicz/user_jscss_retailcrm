import { php2steblya as api } from '@helpers/api';

export default class Allowness {
	constructor() {
		this.$ths = $('.modern-table th');
		this.$trs = $('.modern-table tr[data-url]');
		this.indexes = {};
	}

	async init() {
		this.defineIndexes();
		if (!('id' in this.indexes) || !('shop' in this.indexes) || !('allowness' in this.indexes)) return;

		this.renameAndHideColumns();
		const productData = this.collectProductData();
		if (!productData.length) return;

		const availabilityData = await this.fetchAvailabilityData(productData);
		this.addAvailabilitySelects(availabilityData);
	}

	// определяет по индексам нужные столбцы
	defineIndexes() {
		this.$ths.each((index, th) => {
			const text = $(th).text().trim();
			if (text === 'Производитель') {
				this.indexes.allowness = index;
			} else if (text === 'Внешний ID') {
				this.indexes.id = index;
			} else if (text === 'Название') {
				this.indexes.title = index;
			} else if (text === 'Магазин') {
				this.indexes.shop = index;
			}
		});
	}

	// переименовывает и скрывает столбцы
	renameAndHideColumns() {
		this.$ths.eq(this.indexes.allowness).find('a').text('Доступность');
		this.$ths.eq(this.indexes.id).hide();
		this.$trs.each((_, e) => $(e).find('td').eq(this.indexes.id).hide());
	}

	// собирает данные о товарах, для которых надо получить доступность из БД
	collectProductData() {
		let data = [];
		this.$trs.each((_, e) => {
			if (!$(e).find('td:first-child').children().length) return;
			data.push({
				id: $(e).find('td').eq(this.indexes.id).text().trim(),
				title: $(e).find('td').eq(this.indexes.title).text().trim(),
				shop: $(e).find('td').eq(this.indexes.shop).text().trim()
			});
		});
		return data;
	}

	// получает доступность из БД
	async fetchAvailabilityData(data) {
		const apiResponse = await api('FromDB&request=allowness_by_products_ids').post(data);
		const availabilityData = apiResponse.reduce((acc, item) => {
			acc[item.id] = item.allowed_today;
			return acc;
		}, {});
		return availabilityData;
	}

	// добавляет выпадающий список доступности для каждого товара
	addAvailabilitySelects(data) {
		this.$trs.each((_, tr) => {
			const $tr = $(tr);
			const id = parseInt($tr.find('td').eq(this.indexes.id).text().trim());
			if (!data.hasOwnProperty(id)) return;

			const allowedToday = data[id];
			const $select = $(`<select data-shop="${$tr.find('td').eq(this.indexes.shop).text().trim()}" data-id="${id}">`);
			$select
				.append(`<option value="1" ${allowedToday == 1 ? 'selected' : ''}>сегодня</option>`)
				.append(`<option value="0" ${allowedToday == 0 ? 'selected' : ''}>завтра</option>`)
				.append(`<option value="-1" ${allowedToday == -1 ? 'selected' : ''}>никогда</option>`)
				.on('click', e => e.stopPropagation())
				.off('change')
				.on('change', async (select) => {
					const $this = $(select.target);
					const apiResponse = await api('ToDB&request=allowness_by_product_id').post({
						id: $this.data('id'),
						shop: $this.data('shop'),
						allowed_today: $this.val()
					});
				});
			$tr.find('td').eq(this.indexes.allowness).html($select);
		});
	}
} 