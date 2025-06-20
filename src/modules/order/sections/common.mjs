import dom from '@helpers/dom';

export default class Common {
	constructor() {
		this.section = dom('#order-common');
	}

	init() {
		this.hideOrderType();
	}

	// скрывает блок "Тип заказа"
	hideOrderType() {
		this.section.nodes('[data-order-section="common"] > .input-group').at(0).hide();
	}
}