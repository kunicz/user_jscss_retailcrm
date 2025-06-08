import { iconsSVG } from '@src/mappings';
import { intaro } from '@modules/order/sections';
import dom from '@helpers/dom';

export default class CustomFields {
	constructor() {
		this.intaro = intaro + '_customFields';
		this.block = dom('#order-custom-fields');
	}

	init() {
		this.florist();
		this.moveToRight();
		this.labels();
		this.lovix();
		this.warning();
	}

	//переносим блок в правую колонку
	moveToRight() {
		this.block.lastTo(this.block.ancestor('.order-main-box').node('.m-box__right-side'));
	}

	//лейблы над текстовыми полями
	labels() {
		this.block.nodes('.input-group').forEach(el => {
			if (el.nodes('input:not([type=checkbox]), textarea, select').length) el.addClass('text');
		});
	}

	//lovix
	lovix() {
		dom(`[for="${this.intaro}_lovixlube"]`).toFirst(iconsSVG.lovixlube);
	}

	//warning
	warning() {
		dom(`[for="${this.intaro}_warning"]`).toFirst(iconsSVG.warning);
	}

	//переносим флориста в основной блок
	florist() {
		const site = dom(`#${intaro}_site_chosen`);
		if (site) dom(`#${this.intaro}_florist`).parent().prevTo(site.parent());
	}
}