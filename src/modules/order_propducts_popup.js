import { mutationObserver, wait, waitCheck, waitDomElement } from '@helpers';
import { calculator } from './order_products';
import '../css/order_products_popup.css';

let $popup;
const popupPrefix = 'product-popup';

export async function popup() {
	listen();
}

function listen() {
	const popupCollback = async (node) => {
		//открытие попапа
		if (node.id === popupPrefix) {
			$popup = $(node);
			stripPrice();
			await popupLogic();
		}

		//добавление контена в попап
		if (node.classList.contains(`${popupPrefix}__container`)) {
			await popupLogic();
		}
	}
	mutationObserver({ addedCallback: popupCollback, config: { childList: true, subtree: true } });

	async function popupLogic() {
		await calculatorPlaceholder();
		await defualtShop();
	}
}

async function defualtShop() {
	const shop = 'Остатки (мск)';
	const blockSelector = `#${popupPrefix} [class^="sidebar__form"] [id^="ui-select"]`;

	//список магазинов
	const target = await waitDomElement(blockSelector, 5000);
	if (!target) return console.log(`target: Не найден ${blockSelector}`);

	const targetSelector = `${blockSelector} [class^="UiSelect-select-target"]`;
	const contentSelector = `${blockSelector} [class^="UiSelect-select__content"]`;
	const inputSelector = `${targetSelector} input`;

	//селект выбора магазина
	const targetSelect = await waitDomElement(targetSelector, 5000);
	if (!targetSelect) return console.log(`targetSelect: Не найден ${targetSelector}`);

	//инпут выбора магазина
	const targetInput = await waitDomElement(inputSelector);
	if (!targetInput) return console.log(`targetInput: Не найден ${inputSelector}`);

	if (!targetInput.value) {
		await waitCheck(() => targetInput.value !== '', 5000);
	}

	if (targetInput.value === shop) return;

	//клик по селекту для открытия списка магазинов
	targetSelect.click();

	//всплывающее окно со списком магазинов
	const targetContent = await waitDomElement(contentSelector, 5000);
	if (!targetContent) return console.log(`targetContent: Не найден ${contentSelector}`);

	//пункт нужного магазина с списке
	const targetOption = [...targetContent.querySelectorAll('div[aria-selected]')].find(div =>
		div.textContent.includes(shop)
	);
	if (!targetOption) return console.log('targetOption: Магазин "Остатки (мск)" не найден');

	//клик по магазину
	targetOption.click();

	await wait(500);

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
	const selector = `[class^="${popupPrefix}__header"]`;
	await waitDomElement(selector);
	const cont = $(selector);
	cont.find(`#${popupPrefix}-title`).html('<div id="popupCalculator" />');
	cont.children('p').hide();
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

