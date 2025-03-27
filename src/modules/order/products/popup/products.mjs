import dom from '@helpers/dom';
import wait from '@helpers/wait';
import { calculate } from '@modules/order/finances';
import { ProductsRows as Products } from '@modules/order/products/rows';
import { Order } from '@pages/order';
import '@css/order_products_popup.css';

export default () => new ProductsPopup().init();

class ProductsPopup {
	constructor() {
		this.$popup = null;
		this.p = 'product-popup';
	}

	init() {
		this.listen();
	}

	listen() {
		// открытие попапа
		dom.watcher().setSelector(`#${this.p}`).setCallback(async (node) => {
			this.$popup = $(node);
			this.stripPrice();
			this.popupLogic();
		}).start();

		// добавление контена в попап
		dom.watcher().setSelector(`.${this.p}__container`).setCallback(async () => {
			this.popupLogic();
		}).start();
	}

	// логика работы попапа
	popupLogic() {
		this.calculatorPlaceholder();
		this.defualtShop();
	}


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

		await wait.halfsec();

		//клик по кнопке "Найти"
		const searchButton = this.$popup.find('[class^="sidebar__footer"] button.omnica-button_secondary')[0];
		searchButton.click();
	}

	//обнуляем стоимость каталожных товаров (не допников)
	stripPrice() {
		Products.$get().filter(p => p.isCatalog && !p.isDopnik).each((_, e) => {
			$(e).find('.order-price__initial-price__input').val(0);
			$(e).find('.order-price__button_submit').trigger('click');
		});
	}

	async calculatorPlaceholder() {
		const selector = `[class^="${this.p}__header"]`;
		const header = await wait.element(selector);
		if (!header) throw new Error(`Не найден ${selector}`);
		const $header = $(header);
		$header.find(`#${this.p}-title`).html('<div id="popupCalculator" />');
		$header.children('p').hide();
		calculate();
	}

	// логика работы кнопки "Добавить товар"
	async popupOpenButton() {
		//скрываем кнопку, если нет магазина и менеджера
		setInterval(() => {
			const conditions = [
				$(`#${Order.intaro}_manager`).val(),
				$(`#${Order.intaro}_site`).val(),
				//$(`#${Order.intaro}_firstName`).val()
			];
			$('#add-order-product-btn').parent().toggle(!conditions.some(c => !c));
		}, 500);
	}
}