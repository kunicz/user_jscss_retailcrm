import dom from '@helpers/dom';

export default class FinancesManager {
	init() {
		this.hideData();
	}

	// скрывает данные в таблице
	hideData() {
		dom('#list-total-summ').hide();
		dom('#list-total-margin').hide();
	}
}
