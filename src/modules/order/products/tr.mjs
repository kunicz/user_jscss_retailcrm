import RootClass from '@helpers/root_class';
import ensure from '@helpers/ensure';
import normalize from '@helpers/normalize';
import wait from '@helpers/wait';
import Properties from '@modules/order/products/properties';
import { intaro } from '@modules/order/sections';
import { noFlowers, vehicleFormats, moysklad } from '@src/mappings';
import { getCrmProduct, getMsProduct, getDbProduct } from '@src/requests';
import { ARTIKUL_PODPISKA, ARTIKUL_DOPNIK, ARTIKUL_DONAT } from '@root/config';
import dom from '@helpers/dom';

export default class ProductsTr extends RootClass {
	constructor(tr) {
		if (dom.isOrphan(tr)) return;
		super();
		this.tbody = tr.parent();
		this.tr = tr;
	}

	async init() {
		await this.data();
		this.getters(); // устанавливаем геттеры
		this.setters(); // устанавливаем сеттеры
		const propertiesPromise = new Properties(this.tr).init(); // добавляем недостающие properties
		this.auto();
		this.dopnikPurchasePrice();
		this.moysklad();
		await propertiesPromise; // обязательно надо дождаться, чтоб несколько инстансов Properties в разных tr не накладывались друг на друга
		this.tr.addClass('loaded');
	}

	async data() {
		this.tr.crm = await getCrmProduct(this.tr.data('product-id'));
		const shop_crm_id = dom(`#${intaro}_site`).val();
		if (!shop_crm_id) return; // например, если это страница нового заказа и магазин еще не выбран
		this.tr.db = await getDbProduct(this.tr.crm.externalId, shop_crm_id);
		this.tr.ms = await getMsProduct(this.tr.crm.id);
	}

	// геттеры для всех дынных о товаре прямо из ноды tr
	getters() {
		this.tr.getTitle = () => this.tr.crm.name;
		this.tr.getFullTitle = () => this.tr.node('td[data-type="item-preview"] a[href^="/product"]')?.txt();
		this.tr.getPrice = () => ensure.number(this.tr.node('input[name*="initialPrice"]')?.val());
		this.tr.getPurchasePrice = () => ensure.number(this.tr.node('input[name*="purchasePrice"]')?.val());
		this.tr.getQuantity = () => ensure.number(this.tr.node('input[name*="quantity"]')?.val());
		this.tr.getDiscount = () => ensure.number(this.tr.node('input[name*="discount"]')?.val());
		this.tr.getAmount = () => this.tr.getPrice() * this.tr.getQuantity();
		this.tr.getProperties = () => properties(this.tr);
		this.tr.isCatalog = () => !!this.tr.node('td[data-type="item-preview"] img'); // проверяем по наличию фотки
		this.tr.isPodpiska = () => this.tr.db.type == ARTIKUL_PODPISKA;
		this.tr.isDopnik = () => this.tr.db.type == ARTIKUL_DOPNIK;
		this.tr.isDonat = () => this.tr.db.type == ARTIKUL_DONAT;
		this.tr.isNoFlower = () => noFlowers.some(p => p.id == this.tr.crm.id);
		this.tr.isFlower = () => !(this.tr.isCatalog() || this.tr.isNoFlower()); // каталожный товар не может бытьцветком по определению

		// собирает все пропертисы в массив для this.data
		function properties(tr) {
			const td = tr.node('td[data-type="item-property-list"]');
			const codes = td.nodes('input[name*="[code]"]').map(el => el.val());
			const names = td.nodes('input[name*="[name]"]').map(el => el.val());
			const values = td.nodes('input[name*="[value]"]').map(el => el.val());
			return codes.map((code, i) => ({ code, name: names[i], value: values[i] }));
		}
	}

	// сеттеры редактируемых данных товара
	setters() {
		this.tr.setPrice = async (value) => {
			const target = this.tr.node('td[data-type="item-price"] a.price_uvott');
			const fieldId = target.parent().attr('id');
			const modalId = `#order-product-section--${id(fieldId)}-popper`;
			const inputSelector = '.omnica-popper__content > div:first-child input';
			await setWithModal(target, fieldId, modalId, inputSelector, value);
		}
		this.tr.setPurchasePrice = async (value) => {
			const target = this.tr.node('td[data-type="item-purchase-price"] a[id^="order-product-section"]');
			const fieldId = target.attr('id');
			const modalId = `#order-product-section--${id(fieldId)}-editor`;
			const inputSelector = 'input[id^="ui-input"]';
			await setWithModal(target, fieldId, modalId, inputSelector, value);
		}
		this.tr.setQuantity = async (value) => {
			const target = this.tr.node('td[data-type="item-quantity"] input[id^="omnica-input-number"]');
			await setWithoutModal(target, value);
		}

		// возвращает чистый номерной идентификатор, который связывает target и modal
		function id(fieldId) {
			return fieldId.replace(/\D+/g, '');
		}

		// универсальный сеттер для полей с модальным окном
		async function setWithModal(target, fieldId, modalId, inputSelector, value) {
			const oldValue = target.txt(); // сохраняем старое значение
			const style = dom(`<style>${modalId}{display:none}</style>`).lastTo('head'); // создаем стиль для скрытия modal
			target.trigger('click'); // клик для вызова модального окна
			const modal = await wait.element(modalId); // ждем появления модального окна
			if (!modal) return console.warn(`не нашел мадальное окно для ${fieldId}`);
			dom(modal).node(inputSelector).val(normalize.number(value)).trigger('input'); // вводим значение в модальное окно
			await wait.halfsec(); // ждем полсекунды (vue не дает моментально изменить значение и сделать клик на кнопку "Сохранить")
			modal.node('.omnica-button_primary').trigger('click'); // клик на кнопку "Сохранить" в модалке
			await wait.check(() => target.txt() !== oldValue); // ждем когда vue обновит значение в target
			await wait.halfsec(); // ждем полсекунды (без этого vue опять сходит с ума)
			style.remove(); // удаляем стиль
		}

		// универсальный сеттер для полей без модального окна
		async function setWithoutModal(target, value) {
			const oldValue = target.txt(); // сохраняем старое значение
			target.val(normalize.number(value)).trigger('input'); // вводим значение в input
			await wait.check(() => target.txt() !== oldValue); // ждем когда vue обновит значение в target
		}
	}

	// устанавливает значение поля "автомобильный курьер"
	auto() {
		const format = this.tr.getProperties().find(p => p.code === 'for-mat')?.value;
		if (!format) return;
		const isAuto = vehicleFormats.includes(format);
		const input = dom(`#${intaro}_customFields_auto_courier`);
		if (input.prop('checked') === isAuto) return;
		input.prop('checked', isAuto);
		console.log('установлен автокурьер');
	}

	// устанавливает закупочную цену допника
	async dopnikPurchasePrice() {
		if (!this.tr.isDopnik()) return;
		if (this.tr.getPurchasePrice() > 0) return;
		if (this.tr.getPurchasePrice() == this.tr.db.purchase_price) return;
		this.tr.setPurchasePrice(this.tr.db.purchase_price);
		console.log('закупочная цена допника', this.tr.db.purchase_price);
	}

	// добавляет ссылку на переход в мойсклад
	moysklad() {
		if (!this.tr.ms) return;
		const img = dom(`<img src="${moysklad.logo}" alt="мойсклад" />`);
		const a = dom(`<a class="moysklad" href="${moysklad.orderUrl}${this.tr.ms.id}" target="_blank"></a>`);
		a.toLast(img).lastTo(this.tr.node('td[data-type="item-preview"]'));
	}
}