import Allowness from '@modules/products/allowness';

export default class Products {
	static name = 'products';

	constructor() {
		this.allowness = new Allowness();
	}

	init() {
		this.links();
		this.allowness.init();
	}

	destroy() {
		this.allowness.destroy();
	}

	//укорачиваем ссылку на товар
	links() {
		$('tr[data-url] td:gt(2) a').each((_, a) => $(a).text($(a).text().replace(/\?.*$/, '')));
	}

	//внедряем доступность
	async allowness() {
		//определяем номера столбцов
		const indexes = {};
		$('.modern-table th').each(function (index) {
			const text = $(this).text().trim();
			if (text === 'Производитель') {
				indexes.allowness = index;
			} else if (text === 'Внешний ID') {
				indexes.id = index;
			} else if (text === 'Название') {
				indexes.title = index;
			} else if (text === 'Магазин') {
				indexes.shop = index;
			}
		});
		if (!('id' in indexes) || !('shop' in indexes) || !('allowness' in indexes)) return;

		//переименовываем столбец "Произвоитель" на "Доступность"
		$('.modern-table th').eq(indexes.allowness).find('a').text('Доступность');

		//скрываем столбец ID
		$('.modern-table th').eq(indexes.id).hide();
		$('tr[data-url]').each((_, e) => $(e).find('td').eq(indexes.id).hide());

		let data = [];
		//собираем данные о товарах, для которых надо получить доступность из БД
		$('tr[data-url]').each((_, e) => {
			if (!$(e).find('td:first-child').children().length) return; //если товар без картинки (это остатки), он нас не интересует
			data.push({
				id: $(e).find('td').eq(indexes.id).text().trim(),
				title: $(e).find('td').eq(indexes.title).text().trim(),
				shop: $(e).find('td').eq(indexes.shop).text().trim()
			});
		});
		if (!data.length) return;

		//отправляем данные на сервер и запрашиваем данные о доступности
		const response = await fetch('https://php.2steblya.ru/ajax.php?script=FromDB&request=allowness_by_products_ids', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});
		const fromDB = await response.json();
		if (!fromDB.success) return;
		data = fromDB.response.reduce((acc, item) => {
			acc[item.id] = item.allowed_today;
			return acc;
		}, {});

		//добавляем селекты с доступностью
		$('tr[data-url]').each((_, e) => {
			const id = parseInt($(e).find('td').eq(indexes.id).text().trim());
			if (!data.hasOwnProperty(id)) return;
			const allowedToday = data[id];
			const select = $('<select data-shop="' + $(e).find('td').eq(indexes.shop).text().trim() + '" data-id="' + id + '">');
			select.append('<option value="1" ' + (allowedToday == 1 ? 'selected' : '') + '>сегодня</option>');
			select.append('<option value="0" ' + (allowedToday == 0 ? 'selected' : '') + '>завтра</option>');
			select.append('<option value="-1" ' + (allowedToday == -1 ? 'selected' : '') + '>никогда</option>');
			select.on('click', e => e.stopPropagation());
			select.off('change').on('change', e => {
				console.log('Change event triggered');
				console.log('Sending data:', $(e.target).data('id'), $(e.target).data('shop'), $(e.target).val());
				fetch('https://php.2steblya.ru/ajax.php?script=ToDB&request=allowness_by_product_id', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						id: $(e.target).data('id'),
						shop: $(e.target).data('shop'),
						allowed_today: $(e.target).val()
					})
				})
					.then(response => response.json())
					.then(data => {
						console.log('Response from server:', data);
					})
					.catch(error => {
						console.error('Error:', error);
					});
			});
			$(e).find('td').eq(indexes.allowness).html(select);
		});
	}
}