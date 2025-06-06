import RootClass from '@helpers/root_class';
import { indexes } from '@modules/orders/indexes';

export default class OrdersRow extends RootClass {
	constructor(th) {
		super();
		this.th = th;
		this.slug = indexes.find(i => i.index === this.th.indexOf('th')).slug;
	}

	init() {
		if (this.slug === 'shop') this.th.empty();
		if (this.slug === 'created') this.th.hide();
		if (this.slug === 'comments') this.th.txt('Комментарии');
		if (this.slug === 'uznal') this.th.txt('Откуда узнал').hide();
		this.th.attr('col', this.slug);
	}
}