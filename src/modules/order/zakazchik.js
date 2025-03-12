import { iconsSVG } from '@src/mappings';
import normalize from '@helpers/normalize';

export default () => {
	isPoluchatel();
	telegram();
	otkudaUznal();
	phones();
}

function phones() {
	const selector = '#intaro_crmbundle_ordertype_phone, #intaro_crmbundle_ordertype_additionalPhone, #intaro_crmbundle_ordertype_customFields_phone_poluchatelya';
	const phoneFields = $(selector);
	const normalizePhoneValue = field => $(field).val(normalize.phone($(field).val()));
	phoneFields.each((_, field) => normalizePhoneValue(field));
	phoneFields.on('change', e => normalizePhoneValue(e.target));
}

function isPoluchatel() {
	//при клике на галочку берем имя и телефон и вставляем в поля получателя
	//при повторном клике - обнуляем поля
	const zName = $('#intaro_crmbundle_ordertype_firstName');
	const pName = $('#intaro_crmbundle_ordertype_customFields_name_poluchatelya');
	const zPhone = $('#intaro_crmbundle_ordertype_phone');
	const pPhone = $('#intaro_crmbundle_ordertype_customFields_phone_poluchatelya');

	if (!zName.val() && !pName.val() && !zPhone.val() && !pPhone.val()) return;

	const input = $('#intaro_crmbundle_ordertype_customFields_zakazchil_poluchatel');
	const isEqual = zName.val() == pName.val() && zPhone.val() == pPhone.val();

	input.prop('checked', isEqual);
	input.on('change', () => {
		if (!input.prop('checked')) {
			pName.val('');
			pPhone.val('');
			return;
		}
		pName.val(zName.val());
		pPhone.val(zPhone.val());
	});
}

function telegram() {
	$('#intaro_crmbundle_ordertype_customFields_messenger_zakazchika')
		.on('blur', e => $(e.target).val($(e.target).val().replace('@', '')))
		.prev().html('Телеграм').prepend(iconsSVG.telegram);
}

function otkudaUznal() {
	$('#intaro_crmbundle_ordertype_customFields_otkuda_o_nas_uznal').prev().text('Откуда узнал');
}