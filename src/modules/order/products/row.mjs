import Properties from '@modules/order/products/properties';
import ProductsData from '@modules/order/products/data';
import Order from '@pages/order';
import { vehicleFormats, moysklad } from '@src/mappings';
import normalize from '@helpers/normalize';

export default class ProductsRow {
	constructor(tr) {
		this.$ = $(tr);
		this.product = null;
		this.props = null;
	}

	async init() {
		this.product = new ProductsData(this.$);
		await this.product.init();

		this.preserveTr();
		this.classes();
		this.catalog();
		this.ostatki();
	}

	destroy() {
		this.product.destroy();
		this.product = null;
		this.props?.destroy?.();
		this.props = null;
		this.$ = null;
	}

	// сохраняет tr для возможности удаления
	preserveTr() {
		this.product.$container.get(0).tr = this.$.get(0);
	}

	// логика для каталожных товаров
	catalog() {
		if (!this.product.isCatalog) return;

		this.auto();
		this.bukety();
		this.cards();
		this.moysklad();
		this.dopnikPurchasePrice();
		this.properties();
	}

	// устанавливает классы для товаров
	classes() {
		if (this.product.isCatalog) this.$.addClass('catalog');
		if (this.product.isPodpiska) this.$.addClass('podpiska');
		if (this.product.isDopnik) this.$.addClass('dopnik');
		if (this.product.isDonat) this.$.addClass('donat');
		if (this.product.isTransport) this.$.addClass('transport');
		this.product.isFlower ? this.$.addClass('flower') : this.$.addClass('noflower');
	}

	// добавляет ссылку на переход в мойсклад
	moysklad() {
		if (!this.product.ms) return;

		const $img = $(`<img src="${moysklad.logo}" alt="мойсклад" />`);
		const $a = $(`<a class="moysklad" href="${moysklad.orderUrl}${this.product.ms.id}" target="_blank"></a>`);
		$a.append($img).appendTo(this.$.find('.title'));
	}

	// проверяет, нужен ли курьер на автомобиле
	isAuto() {
		const $format = this.product.properties.$items.filter('[title^="фор"]');
		if (!$format.length) return false;

		if (
			this.product.title !== 'БОЛЬШОЙ ДОБРЫЙ СЧАСТЛИВЫЙ МЕДВЕДЬ' &&
			!vehicleFormats.includes($format.attr('title').split(": ")[1])
		) return false;

		return true;
	}

	// устанавливает значение поля "автомобильный курьер"
	auto() {
		const isAuto = this.isAuto();
		const $input = $(`#${Order.intaro}_customFields_auto_courier`);
		if ($input.prop('checked') === isAuto) return;

		$input.prop('checked', isAuto);
		console.log('Автокурьер', isAuto);
	}

	// устанавливает значение поля "букеты в заказе"
	// более не используется, но оставлено для обратной совместимости
	// и для того, чтобы оставался стобец "букеты в заказе" в общей таблице закзов
	bukety() {
		const $input = $(`#${Order.intaro}_customFields_bukety_v_zakaze`);
		$input.parent().hide();
		return;

		const bukety = [];
		bukety.push(`${this.product.title} (${this.product.quantity} шт)`);
		const value = bukety.join(',<br>');
		if ($input.val() === value) return;
		$input.val(value).change();
	}

	// устанавливает значение поля "карточка"
	// более не используется, но оставлено для обратной совместимости
	// и для того, чтобы оставался стобец "выебри карточку" в общей таблице закзов
	cards() {
		const $input = $(`#${Order.intaro}_customFields_card`);
		$input.parent().hide();
		return;

		const card = this.product.properties.filter('[title*="карточк"]');
		if (!card.length) return;

		// собираем все карточки в массив
		const cards = [];
		cards.push(card.attr('title').split(": ")[1]);
		//удаляем дубликаты
		//исхожу из того, что не бывает такого, что есть в одном заказе два букета и оба со своим текстом, причем разным
		//во всех остальных случаях, кажется, этого будет достаточно
		const cardsUnique = [...new Set(cards)];
		if (!cardsUnique.length) return;
		const value = cardsUnique.length === 1 ? cardsUnique[0] : 'разные';
		if ($input.val() === value) return;
		$input.val(value);
	}

	// устанавливает закупочную цену допника
	async dopnikPurchasePrice() {
		if (!this.product.isDopnik) return;

		const $input = this.$.find('td.purchase-price input.purchase-price');
		const value = normalize.int($input.val());

		if (value > 0) return;
		if (value == this.product.db.purchase_price) return;

		$input.val(this.product.db.purchase_price).change();
		this.$.find('td.purchase-price button').trigger('click');
		console.log('Закупочная цена допника', value);
	}

	// свойства
	properties() {
		this.props = new Properties(this.product);
		this.props.init();
	}

	//остатки
	ostatki() {
		const $ostatki = this.$.find('.available-inventory-row');
		if (!$ostatki.length) return;

		// если остатков нет, то выводим 0
		if ($ostatki.find('.not-enough-to-reserve').length) $ostatki.html('0');
		$ostatki.html(`еще ${normalize.int($ostatki.text())} шт`);

		// если остатков бесконечно (> 100), то скрываем
		if (normalize.int($ostatki.find('[data-available-quantity]')?.attr('data-available-quantity')) || 999 > 100) $ostatki.hide();
	}
}