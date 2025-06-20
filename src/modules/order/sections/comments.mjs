import { intaro } from '@modules/order/sections';
import dom from '@helpers/dom';

export default class Comments {
	init() {
		this.changeHeadings();
		this.comments();
	}

	//изменяем заголовки
	changeHeadings() {
		dom('#order-customer-comment .collapse-section__title').txt('Комментарий для курьера');
		dom('#order-manager-comment .collapse-section__title').txt('Комментарий для флориста');
	}

	//разделяем комментарии из тильды на два поля (курьер и флорист)
	comments() {
		const devider = '***курьер***';
		const floristField = dom(`#${intaro}_managerComment`); //поле для флориста
		const courierField = dom(`#${intaro}_customerComment`); //поле для курьера
		if (!floristField.length || !courierField.length) return;

		const commentValue = courierField.val();
		if (!commentValue.includes(devider)) return;

		// Разбиваем текст, убираем пустые пробелы
		const text = commentValue.split(devider).map(e => e.trim());

		// Устанавливаем значения, но только если они существуют
		if (text[1]) {
			floristField.val(text[1]);
			console.log('Комментарий для флориста установлен', text[1]);
		}
		if (text[2]) {
			courierField.val(text[2]);
			console.log('Комментарий для курьера установлен', text[2]);
		}
	}
}
