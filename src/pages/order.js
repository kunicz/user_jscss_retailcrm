import { isPage, iconsSVG } from '../helpers';
import { products } from './order_products';
import { dostavka } from './order_dostavka';
import { zakazchik } from './order_zakazchik';
import { getCustomerById } from '../retailcrm';
import '../css/order.css';

export function order() {
	if (!isPage('orders/.+')) return;

	console.log('user_jscss : order');

	customFields();
	comments();
	florist();
	dostavka();
	zakazchik();
	discount();
	products();
}

function customFields() {
	//переносим вправо
	$('#order-custom-fields').appendTo($('#order-custom-fields').parents('.order-main-box').find('.m-box__right-side'));
	//лейблы над текстовыми полями
	$('#order-custom-fields .input-group').each((_, e) => {
		if ($(e).find('input:not([type=checkbox])').length || $(e).find('textarea').length || $(e).find('select').length) $(e).addClass('text');
	});
	//игнорировать триггер скидки
	const inputMain = $('#intaro_crmbundle_ordertype_customFields_discount_trigger_ignore');
	inputMain.parent().hide();
	$('<input type="checkbox" class="input-field" />')
		.prop('checked', inputMain.prop('checked'))
		.on('change', e => inputMain.prop('checked', $(e.target).prop('checked')))
		.wrap('<div class="tooltip"></div>')
		.parent()
		.prepend('<span>Игнорировать триггер скидки</span>')
		.append(`<div class="tooltip__content"><div class="tooltip__inner">Для STAY TRUE Flowers автоматически ставится скидка в зависитмости от суммы всех заказов клиента</div></div>`)
		.wrap('<div id="ignoreDiscountTrigger" class="order-row__top"></div>')
		.parent()
		.insertBefore('#patch-order-discount-errors');
	//lovix
	$('[for="intaro_crmbundle_ordertype_customFields_lovixlube"]').prepend(iconsSVG.lovixlube);
	//warning
	$('[for="intaro_crmbundle_ordertype_customFields_warning"]').prepend(iconsSVG.warning);

}

function comments() {
	//заголовки
	$('#order-customer-comment .collapse-section__title').text('Комментарий для курьера');
	$('#order-manager-comment .collapse-section__title').text('Комментарий для флориста');
	//поля
	if (!$('#intaro_crmbundle_ordertype_customerComment').val().includes('***курьер***')) return;
	const text = $('#intaro_crmbundle_ordertype_customerComment').val().split(/\*{3}.+\*{3}/).map(e => e.replace(/^\n/, '').replace(/\n$/, ''));
	$('#intaro_crmbundle_ordertype_customerComment').val(text[1]);
	$('#intaro_crmbundle_ordertype_managerComment').val(text[2]);
}

function florist() {
	//переносим флориста в основной блок
	$('#intaro_crmbundle_ordertype_customFields_florist').parent().insertBefore($('#intaro_crmbundle_ordertype_manager').parent());
}

async function discount() {
	//автоматическая скидка для покупателей STF
	if ($('#intaro_crmbundle_ordertype_site_chosen').text() != 'STAY TRUE Flowers') return;
	if ($('#select').text().trim() == 'Выполнен') return;
	//if (!$('.order-status .os-vip').is('.os-select')) return;
	if ($('#intaro_crmbundle_ordertype_customFields_discount_trigger_ignore').is(':checked')) return;
	if (parseInt($('[title="Количество заказов, оформленных данным покупателем"]').text().trim().match(/(?:\d+) всего/)) <= 1) return;
	const customer = await getCustomerById($('[data-order-customer-id]').attr('data-order-customer-id'));
	if (!customer) return;
	if (customer.ordersCount < 2) return;
	if (!customer.totalSumm) return;
	let discount = 0;
	if (customer.totalSumm < 25000) discount = 5;
	if (customer.totalSumm >= 25000 && customer.totalSumm < 50000) discount = 7;
	if (customer.totalSumm >= 50000 && customer.totalSumm < 100000) discount = 10;
	if (customer.totalSumm >= 100000) discount = 15;
	$('#intaro_crmbundle_ordertype_discountManualPercent').val(discount).change();
}
