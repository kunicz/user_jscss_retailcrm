export default () => new Common().init();

class Common {
	constructor() {
		this.$container = $('#order-common');
	}

	init() {
		this.hideOrderType();
	}

	hideOrderType() {
		this.$container.find('[data-order-section="common"] > .input-group').eq(0).hide();
	}
}