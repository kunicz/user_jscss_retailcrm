export default class Common {
	constructor() {
		this.$container = $('#order-common');
	}

	init() {
		this.hideOrderType();
	}

	// скрывает блок "Тип заказа"
	hideOrderType() {
		this.$container.find('[data-order-section="common"] > .input-group').eq(0).hide();
	}
}