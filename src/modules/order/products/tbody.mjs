import RootClass from '@helpers/root_class';
import ProductsTr from '@modules/order/products/tr';
import dom from '@helpers/dom';

export default class ProductsTbody extends RootClass {
	constructor(tbody) {
		if (dom.isOrphan(tbody)) return;
		super();
		this.tbody = tbody;
		this.tr = tbody.child();
	}

	async init() {
		this.tbody.addClass('loading');
		await new ProductsTr(this.tr).init();
		this.tbody.removeClass('loading').addClass('loaded');
	}
}