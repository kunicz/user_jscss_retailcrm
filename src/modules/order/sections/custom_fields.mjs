import { iconsSVG } from '@src/mappings';
import { Order } from '@pages/order';

export default () => new CustomFields().init();

class CustomFields {
	constructor() {
		this.intaro = `${Order.intaro}_customFields`;
		this.$container = $('#order-custom-fields');
	}

	init() {
		this.florist();
		this.moveToRight();
		this.labels();
		this.ignoreDiscountTrigger();
		this.lovix();
		this.warning();
	}

	//переносим блок в правую колонку
	moveToRight() {
		this.$container.appendTo(this.$container.parents('.order-main-box').find('.m-box__right-side'));
	}

	//лейблы над текстовыми полями
	labels() {
		this.$container.find('.input-group').each((_, e) => {
			if ($(e).find('input:not([type=checkbox]), textarea, select').length) $(e).addClass('text');
		});
	}

	//игнорировать триггер скидки
	ignoreDiscountTrigger() {
		const inputMain = $(`#${this.intaro}_discount_trigger_ignore`);
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
	}

	//lovix
	lovix() {
		$(`[for="${this.intaro}_lovixlube"]`).prepend(iconsSVG.lovixlube);
	}

	//warning
	warning() {
		$(`[for="${this.intaro}_warning"]`).prepend(iconsSVG.warning);
	}

	//переносим флориста в основной блок
	florist() {
		$(`#${this.intaro}_florist`).parent().insertBefore($(`#${Order.intaro}_site`).parent());
	}
}