import { Order } from '@pages/order';

export default (order) => new Comments(order).init();

class Comments {
	constructor(order) {
		this.order = order;
	}

	init() {
		this.changeHeadings();
		this.comments();
	}

	//изменяем заголовки
	changeHeadings() {
		$('#order-customer-comment .collapse-section__title').text('Комментарий для курьера');
		$('#order-manager-comment .collapse-section__title').text('Комментарий для флориста');
	}

	//разделяем комментарии из тильды на два поля (курьер и флорист)
	comments() {
		const devider = '***курьер***';
		const $floristField = $(`#${Order.intaro}_managerComment`); //поле для флориста
		const $courierField = $(`#${Order.intaro}_customerComment`); //поле для курьера
		if (!$floristField.length || !$courierField.length) return;

		const commentValue = $courierField.val();
		if (!commentValue.includes(devider)) return;

		// Разбиваем текст, убираем пустые пробелы
		const text = commentValue.split(devider).map(e => e.trim());

		// Устанавливаем значения, но только если они существуют
		if (text[1]) $floristField.val(text[1]);
		if (text[2]) $courierField.val(text[2]);
	}
}
