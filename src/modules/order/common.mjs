import { Order } from '@pages/order';

export default (order) => new Common(order).init();
class Common {
	constructor(order) {
		this.order = order;
		this.$container = $('#order-common');
	}

	init() {
		this.hideOrderType();
	}

	hideOrderType() {
		this.$container.find('[data-order-section="common"] > .input-group').eq(0).hide();
	}
}