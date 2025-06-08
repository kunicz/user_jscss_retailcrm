import RootClass from '@helpers/root_class';
import wait from '@helpers/wait';
import dom from '@helpers/dom';

export default class OrderProductsPopup extends RootClass {
	constructor(popup) {
		if (dom.isOrphan(popup)) return;
		super();
		this.popup = popup;
		this.trs = dom('tr[data-item-type="PRODUCT"]');
		const finances = dom('#main').data('finances');
		this.caclulate = finances.calculator.bind(finances);
	}

	init() {
		this.stripPrice();
		this.createCalculator();
		this.defualtShop();
	}

	// создает калькулятор в заголовке попапа
	createCalculator() {
		const header = this.popup.node('[class*="product-tab__main"]').child('[class*="head"]');
		header.child('[id$="title"]')?.remove(); // Добавление товара или услуги
		header.child('[class*="head__counter"]')?.remove(); // Выбрано:
		header.toFirst('<h2 id="popupCalculator" />');
		this.caclulate();
	}

	//обнуляем стоимость каталожных товаров (не допников)
	async stripPrice() {
		const trs = this.trs.filter(tr => tr.isCatalog() && !tr.isDopnik());
		if (!trs.length) return;
		for (const tr of trs) await tr.setPrice(0);
	}

	// выбирает магазин по умолчанию
	async defualtShop() {
		const targetShop = 'Остатки (мск)'; // Магазин по умолчанию
		const target = this.popup.nodes('.omnica-field.group_DB5L7')[0].node('input'); // целевой target
		const i = target.attr('id').replace(/\D+/g, ''); // его номерной идентификатор
		target.trigger('click');
		const modal = await wait.element(`#omnica-field-${i}-popper`); // ожидаем модальное окно с выбором магазинов
		await wait.element(`#omnica-field-${i}-popper .omnica-select-option`);
		const modalTarget = modal.nodes('.omnica-select-option').find(div => div.txt() === targetShop); // ищем нужный магазин
		modalTarget.trigger('click');
		await wait.halfsec();
		const findBtn = this.popup.node('[class*="filter__footer"]').node('button[type="submit"]'); // кнопка "Найти"
		findBtn.trigger('click');
	}
}