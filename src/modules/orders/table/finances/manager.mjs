export default class FinancesManager {
	init() {
		this.hideData();
	}

	// скрывает данные в таблице
	hideData() {
		$('#list-total-margin,#list-total-summ').hide();
	}
}
