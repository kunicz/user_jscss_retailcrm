import { iconsSVG } from '@src/mappings';
import normalize from '@helpers/normalize';
import { intaro } from '@modules/order/sections';
import dom from '@helpers/dom';

export default class Zakazchik {
	init() {
		this.isPoluchatel();
		this.telegram();
		this.otkudaUznal();
		this.normalizePhones();
	}

	// нормализация телефонов
	normalizePhones() {
		const selector = `#${intaro}_phone, #${intaro}_additionalPhone, #${intaro}_customFields_phone_poluchatelya`;
		const phoneFields = dom(selector);
		const normalizePhoneValue = (field) => {
			if (!field.val()) return;

			const normalizedValue = normalize.phone(field.val());
			if (normalizedValue === field.val()) return;

			field.val(normalizedValue);
			console.log('Телефон нормализован', normalizedValue);
		}
		phoneFields.forEach(field => {
			normalizePhoneValue(field);
			field.listen('change', () => normalizePhoneValue(field));
		});
	}

	//при клике на галочку берем имя и телефон и вставляем в поля получателя
	//при повторном клике - обнуляем поля
	isPoluchatel() {
		const zName = dom(`#${intaro}_firstName`);
		const zPhone = dom(`#${intaro}_phone`);
		const pName = dom(`#${intaro}_customFields_name_poluchatelya`);
		const pPhone = dom(`#${intaro}_customFields_phone_poluchatelya`);

		if (!zName.val() && !pName.val() && !zPhone.val() && !pPhone.val()) return;

		const input = dom(`#${intaro}_customFields_zakazchil_poluchatel`);
		const isEqual = zName.val() === pName.val() && zPhone.val() === pPhone.val();

		if (input.prop('checked') !== isEqual) {
			input.prop('checked', isEqual);
			console.log('Заказчик = получатель', isEqual);
		}
		input.listen('change', () => {
			if (!input.prop('checked')) {
				pName.val('');
				pPhone.val('');
				return;
			}
			pName.val(zName.val());
			pPhone.val(zPhone.val());
		});
	}

	// мессенджер заказчика
	telegram() {
		const input = dom(`#${intaro}_customFields_messenger_zakazchika`)
		input.listen('blur', () => {
			input.val(input.val().replace('@', ''));
			console.log('Телеграм нормализован', input.val());
		});
		input.prev().html('Телеграм').toFirst(iconsSVG.telegram)
	}

	// откуда узнал
	otkudaUznal() {
		dom(`#${intaro}_customFields_otkuda_o_nas_uznal`).prev().txt('Откуда узнал');
	}
}
