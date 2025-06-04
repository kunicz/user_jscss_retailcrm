import RootClass from '@helpers/root_class';
import dom from '@helpers/dom';
import Allowness from '@modules/products/allowness';

export default class Products extends RootClass {
	static name = 'products';

	constructor() {
		super();
		this.allowness = new Allowness();
	}

	init() {
		this.shortenLinks();
		this.allowness.init();
	}

	//укорачиваем ссылку на товар
	shortenLinks() {
		dom('tr[data-url]').forEach(tr => {
			const a = tr.childs('td').at(-1).child('a');
			const shortenedUrl = a.txt().replace(/\?.*$/, '');
			a.txt(shortenedUrl);
		});
	}
}