import { iconsSVG } from '@src/mappings';
import normalize from '@helpers/normalize';
import Order from '@pages/order';

export default class Zakazchik {
	init() {
		this.isPoluchatel();
		this.telegram();
		this.otkudaUznal();
		this.phones();
	}

	phones() {
		const selector = `#${Order.intaro}_phone, #${Order.intaro}_additionalPhone, #${Order.intaro}_customFields_phone_poluchatelya`;
		const $phoneFields = $(selector);
		const normalizePhoneValue = (field) => {
			const $field = $(field);
			const value = $field.val();
			if (!value) return;

			const normalizedValue = normalize.phone(value);
			if (normalizedValue === value) return;

			$field.val(normalizedValue);
			console.log('Телефон нормализован', normalizedValue);
		}
		$phoneFields.each((_, field) => normalizePhoneValue(field));
		$phoneFields.on('change', e => normalizePhoneValue(e.target));
	}

	isPoluchatel() {
		//при клике на галочку берем имя и телефон и вставляем в поля получателя
		//при повторном клике - обнуляем поля
		const $zName = $(`#${Order.intaro}_firstName`);
		const $zPhone = $(`#${Order.intaro}_phone`);
		const $pName = $(`#${Order.intaro}_customFields_name_poluchatelya`);
		const $pPhone = $(`#${Order.intaro}_customFields_phone_poluchatelya`);

		if (!$zName.val() && !$pName.val() && !$zPhone.val() && !$pPhone.val()) return;

		const $input = $(`#${Order.intaro}_customFields_zakazchil_poluchatel`);
		const isEqual = $zName.val() === $pName.val() && $zPhone.val() === $pPhone.val();

		if ($input.prop('checked') !== isEqual) {
			$input.prop('checked', isEqual);
			console.log('Заказчик = получатель', isEqual);
		}
		$input.on('change', () => {
			if (!$input.prop('checked')) {
				$pName.val('');
				$pPhone.val('');
				return;
			}
			$pName.val($zName.val());
			$pPhone.val($zPhone.val());
		});
	}

	telegram() {
		$(`#${Order.intaro}_customFields_messenger_zakazchika`)
			.on('blur', e => $(e.target).val($(e.target).val().replace('@', '')))
			.prev().html('Телеграм').prepend(iconsSVG.telegram);
	}

	otkudaUznal() {
		$(`#${Order.intaro}_customFields_otkuda_o_nas_uznal`).prev().text('Откуда узнал');
	}
}
