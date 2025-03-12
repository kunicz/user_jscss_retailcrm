import dom from '@helpers/dom';
import wait from '@helpers/wait.js';
import { calculator } from './order_products.js';
import '../css/order_products_popup.css';

let $popup;
const p = 'product-popup';

export default async () => {
	listen();
}

function listen() {
	//открытие попапа
	dom.watcher().setSelector(`#${p}`).setCallback(async (node) => {
		$popup = $(node);
		stripPrice();
		await popupLogic();
	}).start();
	//добавление контена в попап
	dom.watcher().setSelector(`.${p}__container`).setCallback(async () => { await popupLogic(); }).start();

	async function popupLogic() {
		await calculatorPlaceholder();
		await defualtShop();
	}
}

async function defualtShop() {
	const shop = 'Остатки (мск)';
	const blockSelector = `#${p} [class^="sidebar__form"] [id^="ui-select"]`;

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
	const searchButton = $popup.find('[class^="sidebar__footer"] button.omnica-button_secondary')[0];
	searchButton.click();
}

//обнуляем стоимость каталожных товаров (не допников)
function stripPrice() {
	$('#order-products-table').find('.catalog:not(.dopnik) td.price').each((_, e) => {
		$(e).find('.order-price__initial-price__input').val(0);
		$(e).find('.order-price__button_submit').trigger('click');
	});
}

async function calculatorPlaceholder() {
	const selector = `[class^="${p}__header"]`;
	const header = await wait.element(selector);
	if (!header) throw new Error(`Не найден ${selector}`);
	const $header = $(header);
	$header.find(`#${p}-title`).html('<div id="popupCalculator" />');
	$header.children('p').hide();
	calculator();
}

//скрываем кнопку, если не указан магазин и имя клиента
async function popupOpenButton() {
	//скрываем кнопку, если нет магазина и менеджера
	setInterval(() => {
		const conditions = [
			$('#intaro_crmbundle_ordertype_manager').val(),
			$('#intaro_crmbundle_ordertype_site').val(),
			//$('#intaro_crmbundle_ordertype_firstName').val()
		];
		$('#add-order-product-btn').parent().toggle(!conditions.some(c => !c));
	}, 500);
}

