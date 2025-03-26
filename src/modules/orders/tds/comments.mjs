import * as cols from '@modules/orders/cols';
import { iconsSVG } from '@src/mappings';
import OrderTd from '@modules/orders/td';

export default (row) => {
	new CommentsTd(row).init();
}

class CommentsTd extends OrderTd {
	static columnName = 'comments';

	constructor(row) {
		super(row);
	}

	init() {
		this.comments();
		this.warning();
	}

	/**
	 * парсит комментарии и формирует их в единый текст
	 */
	comments() {
		const texts = [];
		const courier = this.row.get(cols.commentsCourier)?.replace(/\n/g, '<br>') || '';
		const florist = this.row.get(cols.commentsFlorist)?.replace(/\n/g, '<br>') || '';
		if (florist) { texts.push(`<b>Флористу</b>: <br>${florist}`); }
		if (courier) { texts.push(`<b>Курьеру</b>:<br>${courier}`); }
		this.$td.html(texts.join('<br><br>'));
	}

	// индикатор warning, если не указана важная для флориста информация
	warning() {
		if (!this.row.get(cols.floristWarn)) return;

		const $warnIcon = $(iconsSVG.warning);
		const $warnCont = $('<div class="warn"></div>');
		this.$td.append($warnCont);
		$warnCont.prepend($warnIcon);
	}
}