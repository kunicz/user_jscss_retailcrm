import dom from '@helpers/dom';

export default class FinancesManager {
	init() {
		this.hideData();
	}

	// скрывает данные в таблице
	hideData() {
		dom.one('#list-total-summ')?.hide();
		dom.one('#list-total-margin')?.hide();
	}
}
