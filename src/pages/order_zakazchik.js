import { iconsSVG } from '../helpers';

export function zakazchik() {
	isPoluchatel();
	telegram();
	otkudaUznal();
}

function isPoluchatel() {
	//при клике на галочку берем имя и телефон и вставляем в поля получателя
	//при повторном клике - обнйляем поля
	const zName = $('#intaro_crmbundle_ordertype_firstName');
	const pName = $('#intaro_crmbundle_ordertype_customFields_name_poluchatelya');
	const zPhone = $('#intaro_crmbundle_ordertype_phone');
	const pPhone = $('#intaro_crmbundle_ordertype_customFields_phone_poluchatelya');

	if (!zName.val() && !pName.val() && !zPhone.val() && !pPhone.val()) return;

	const input = $('#intaro_crmbundle_ordertype_customFields_zakazchil_poluchatel');
	input
		.prop('checked', zName.val() == pName.val() && zPhone.val() == pPhone.val())
		.on('change', () => {
			switch (input.prop('checked')) {
				case true:
					pName.val(zName.val());
					pPhone.val(zPhone.val());
					break;
				case false:
					pName.val('');
					pPhone.val('');
					break;
			}
		});
}

function telegram() {
	$('#intaro_crmbundle_ordertype_customFields_messenger_zakazchika').prev().html('Телеграм').prepend(iconsSVG.telegram);
}

function otkudaUznal() {
	$('#intaro_crmbundle_ordertype_customFields_otkuda_o_nas_uznal').prev().text('Откуда узнал');
}