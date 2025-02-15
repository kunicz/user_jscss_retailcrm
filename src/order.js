import { isPage } from './index';
import { iconsSVG } from './mappings';
import { products } from './modules/order_products';
import { dostavka } from './modules/order_dostavka';
import { zakazchik } from './modules/order_zakazchik';
import { retailcrm, cache, normalize } from '@helpers';
import { RESERVED_ARTICLES } from '@root/config';
import './css/order.css';

export const noFlowers = cache([]);

export async function order() {
	if (!isPage('orders/.+')) return;

	console.log('user_jscss : order');

	customFields();
	comments();
	florist();
	dostavka();
	zakazchik();
	discount();
	products();
	printCard();

	function printCard() {
		const orderId = normalize.int($('head title').text());
		const $btn = $('li.print [href$="print/16"]');
		const $product = $('#order-products-table .catalog:first');
		if (!$product.length) return;
		const $card = $product.find('[title^="выебри карточку:"]');
		if (!$card.length) return;
		const artikul = $product.find('[title^="артикул:"]')?.attr('title')?.replace('артикул: ', '');
		if (!artikul) return;
		const probableSku = parseInt(artikul.match(/^(\d+)/)?.[1]);
		const sku = RESERVED_ARTICLES.includes(probableSku) ? artikul : probableSku;
		const shop = $('#intaro_crmbundle_ordertype_site option:selected').val();
		$btn.attr('href', `https://php.2steblya.ru/print_card?order_id=${orderId}&sku=${sku}&shop_crm_id=${shop}`);
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
			.append(`<div class="tooltip__content"><div class="tooltip__inner">Для STAY TRUE Flowers автоматически ставится скидка в зависитмости от суммы всех заказов клиента<br><br>Наличие и Списаие всегда 100%</div></div>`)
			.wrap('<div id="ignoreDiscountTrigger" class="order-row__top"></div>')
			.parent()
			.insertBefore('#patch-order-discount-errors');
		//lovix
		$('[for="intaro_crmbundle_ordertype_customFields_lovixlube"]').prepend(iconsSVG.lovixlube);

		//warning
		$('[for="intaro_crmbundle_ordertype_customFields_warning"]').prepend(iconsSVG.warning);

	}

	function comments() {
		$('#order-customer-comment .collapse-section__title').text('Комментарий для курьера');
		$('#order-manager-comment .collapse-section__title').text('Комментарий для флориста');

		const devider = '***курьер***';
		const managerField = $('#intaro_crmbundle_ordertype_managerComment');
		const commentField = $('#intaro_crmbundle_ordertype_customerComment');
		const commentValue = commentField.val();

		if (!commentValue.includes(devider)) return;

		// Разбиваем текст, убираем пустые пробелы
		const text = commentValue.split(devider).map(e => e.trim());

		// Устанавливаем значения, но только если они существуют
		if (text[1]) commentField.val(text[1]);
		if (text[2]) managerField.val(text[2]);
	}

	function florist() {
		//переносим флориста в основной блок
		$('#intaro_crmbundle_ordertype_customFields_florist').parent().insertBefore($('#intaro_crmbundle_ordertype_site').parent());
	}

	async function discount() {
		// Проверяем, нужно ли применять скидку
		if (
			$('#intaro_crmbundle_ordertype_site_chosen').text() !== 'STAY TRUE Flowers' ||
			$('#select').text().trim() === 'Выполнен' ||
			$('#intaro_crmbundle_ordertype_customFields_discount_trigger_ignore').is(':checked')
		) return;

		// Получаем ID покупателя
		const customerId = $('[data-order-customer-id]').attr('data-order-customer-id');
		if (!customerId) return;

		// Запрашиваем данные клиента
		const customer = await retailcrm.get.customer.byId(customerId);
		if (!customer || customer.ordersCount < 2 || !customer.totalSumm) return;

		// Определяем размер скидки
		const discount = customer.totalSumm < 25000 ? 5 : customer.totalSumm < 50000 ? 7 : 10;

		$('#intaro_crmbundle_ordertype_discountManualPercent').val(discount).change();
	}
}

export function getOrderId() {
	return normalize.int($('.order-num').text());
}