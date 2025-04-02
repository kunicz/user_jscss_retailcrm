export default () => new FinancesManager().init();

class FinancesManager {
	init() {
		this.hideData();
	}

	hideData() {
		$('#list-total-margin,#list-total-summ').hide();
	}
}
