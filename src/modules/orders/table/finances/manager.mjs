import dom from '@helpers/dom';

export default class FinancesManager {
	init() {
		this.hideData();
	}

	// скрывает данные в таблице
	hideData() {
		dom('#list-total-margin,#list-total-summ').hide();
	}
}
