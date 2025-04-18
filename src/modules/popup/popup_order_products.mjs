import observers from '@helpers/observers';
import wait from '@helpers/wait';
import ProductsRows from '@modules/order/products/rows';
import Order from '@pages/order';
import Finances from '@modules/order/finances';
import intervals from '@helpers/intervals';
import '@css/order_products_popup.css';

export default class OrderProductsPopup {
	constructor() {
		this.p = 'product-popup';
		this.calсulatorSelector = 'popupCalculator';
		this.observer = observers.add('order', 'products-popup');
	}

	init() {
		this.listen();
	}

	destroy() {
		this.observer = null;
	}

	listen() {
		this.observer
			.setSelector(`#${this.p}`)
			.onAdded(async () => {
				this.stripPrice();
				this.defualtShop();
				intervals.add('order', 'createCalculator', () => this.createCalculator(), 1000);
			})
			.onRemoved(() => intervals.clear('order', 'createCalculator'))
			.start();
	}

	// создает калькулятор в заголовке попапа
	async createCalculator() {
		if (document.querySelector(`#${this.calсulatorSelector}`)) return;

		const $header = $(`[class^="${this.p}__header"]`);
		$header.find(`#${this.p}-title`).html(`<div id="${this.calсulatorSelector}" />`);
		$header.children('p').hide();
		Finances.calculator();
	}

	// выбирает магазин по умолчанию
	async defualtShop() {
		const shop = 'Остатки (мск)';
		const blockSelector = `#${this.p} [class^="sidebar__form"] [id^="ui-select"]`;

		//список магазинов
		const target = await wait.element(blockSelector);
		if (!target) return console.log(`target: Не найден ${blockSelector}`);

		const targetSelector = `${blockSelector} [class^="UiSelect-select-target"]`;
		const contentSelector = `${blockSelector} [class^="UiSelect-select__content"]`;
		const inputSelector = `${targetSelector} input`;

		//селект выбора магазина
		const targetSelect = await wait.element(targetSelector);
		if (!targetSelect) return console.log(`targetSelect: Не найден ${targetSelector}`);

		//инпут выбора магазина
		const targetInput = await wait.element(inputSelector);
		if (!targetInput) return console.log(`targetInput: Не найден ${inputSelector}`);

		if (!targetInput.value) {
			await wait.check(() => targetInput.value !== '');
		}

		if (targetInput.value === shop) return;

		//клик по селекту для открытия списка магазинов
		targetSelect.click();

		//всплывающее окно со списком магазинов
		const targetContent = await wait.element(contentSelector);
		if (!targetContent) return console.log(`targetContent: Не найден ${contentSelector}`);

		//пункт нужного магазина с списке
		const targetOption = [...targetContent.querySelectorAll('div[aria-selected]')].find(div =>
			div.textContent.includes(shop)
		);
		if (!targetOption) return console.log('targetOption: Магазин "Остатки (мск)" не найден');

		//клик по магазину
		targetOption.click();

		await wait.sec();

		//клик по кнопке "Найти"
		const searchButton = $(`#${this.p}`)?.find('[class^="sidebar__footer"] button.omnica-button_secondary')[0];
		searchButton?.click();
	}

	//обнуляем стоимость каталожных товаров (не допников)
	stripPrice() {
		ProductsRows.products().filter(p => p.isCatalog && !p.isDopnik).forEach(p => {
			p.$.find('.order-price__initial-price__input').val(0);
			p.$.find('.order-price__button_submit').trigger('click');
		});
	}

	// логика работы кнопки "Добавить товар"
	async popupOpenButton() {
		//скрываем кнопку, если нет магазина и менеджера
		intervals.add('order', 'popupOpenButton', () => {
			const conditions = [
				$(`#${Order.intaro}_manager`).val(),
				$(`#${Order.intaro}_site`).val(),
				//$(`#${Order.intaro}_firstName`).val()
			];
			$('#add-order-product-btn').parent().toggle(!conditions.some(c => !c));
		}, 500);
	}
}