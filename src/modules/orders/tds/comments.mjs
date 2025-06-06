import { iconsSVG } from '@src/mappings';
import OrdersTd from '@modules/orders/td';
import dom from '@helpers/dom';

export default class CommentsTd extends OrdersTd {
	static columnName = 'comments';

	init() {
		this.comments();
		this.warning();
	}

	// парсит комментарии и формирует их в единый текст
	comments() {
		const texts = [];
		if (this.crm.managerComment) { texts.push(`<b>Флористу</b>: <br>${this.crm.managerComment}`); }
		if (this.crm.customerComment) { texts.push(`<b>Курьеру</b>:<br>${this.crm.customerComment}`); }
		this.td.html(texts.join('<br><br>'));
	}

	// индикатор warning, если не указана важная для флориста информация
	warning() {
		if (!this.crm.customFields.warning) return;
		dom('<div class="warn"></div>').toFirst(iconsSVG.warning).lastTo(this.td);
	}
}
OrdersTd.registerClass(CommentsTd);