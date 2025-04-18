import Properties from '@modules/order/products/properties';
import Transport from '@modules/order/products/transport';
import ProductsData from '@modules/order/products_data/builder';
import Order from '@pages/order';
import { vehicleFormats, moysklad } from '@src/mappings';
import normalize from '@helpers/normalize';
import observers from '@helpers/observers';

export default class ProductsRows {
	constructor() {
		this.observer = observers.order.add('products-rows');
		this.transport = new Transport();
	}

	async init() {
		this.listen();
		this.transport.init();
		this.productsTable();
		this.sort();
	}

	// слушает изменения в таблице (добавление/удаление товаров)
	listen() {
		this.observer
			.setTarget(self.$table())
			.setSelector('tbody')
			.onAdded(async (node) => {
				this.transport.init();
				this.productsRow(node);
				this.sort();
			})
			.onRemoved((node) => {
				this.transport.init();
				this.sort();
			})
			.start();
	}

	// логика для товаров
	productsTable() {
		self.$get().each((_, node) => this.productsRow(node));
	}
	async productsRow(node) {
		// собирает все данные по товару и сохраняет их в .data('product')
		const product = await ProductsData.add(node);

		this.classes(product);
		this.catalog(product);
		this.ostatki(product);
	}

	// логика для каталожных товаров
	catalog(product) {
		if (!product.isCatalog || product.isTransport) return;

		this.auto(product);
		this.bukety(product);
		this.cards(product);
		this.moysklad(product);
		new Properties(product, Order.crm).init();
	}

	// устанавливает классы для товаров
	classes(product) {
		if (product.isCatalog) product.$.addClass('catalog');
		if (product.isPodpiska) product.$.addClass('podpiska');
		if (product.isDopnik) product.$.addClass('dopnik');
		if (product.isDonat) product.$.addClass('donat');
		if (product.isTransport) product.$.addClass('transport');
		product.isFlower ? product.$.addClass('flower') : product.$.addClass('noflower');
	}

	// добавляет ссылку на переход в мойсклад
	moysklad(product) {
		if (!product.ms) return;
		const $img = $(`<img src="${moysklad.logo}" alt="мойсклад" />`);
		const $a = $(`<a class="moysklad" href="${moysklad.orderUrl}${product.ms.id}" target="_blank"></a>`);
		$a.append($img).appendTo(product.$.find('.title'));
	}

	// проверяет, нужен ли курьер на автомобиле
	isAuto(product) {
		const $format = product.properties.$items.filter('[title^="фор"]');
		if (!$format.length) return false;

		if (
			product.title !== 'БОЛЬШОЙ ДОБРЫЙ СЧАСТЛИВЫЙ МЕДВЕДЬ' &&
			!vehicleFormats.includes($format.attr('title').split(": ")[1])
		) return false;

		return true;
	}

	// устанавливает значение поля "автомобильный курьер"
	auto(product) {
		const isAuto = this.isAuto(product);
		const $input = $(`#${Order.intaro}_customFields_auto_courier`);
		if ($input.prop('checked') === isAuto) return;

		$input.prop('checked', isAuto);
		console.log('Автокурьер', isAuto);
	}

	// устанавливает значение поля "букеты в заказе"
	// более не используется, но оставлено для обратной совместимости
	// и для того, чтобы оставался стобец "букеты в заказе" в общей таблице закзов
	bukety(product) {
		const $input = $(`#${Order.intaro}_customFields_bukety_v_zakaze`);
		$input.parent().hide();
		return;

		const bukety = [];
		bukety.push(`${product.title} (${product.quantity} шт)`);
		const value = bukety.join(',<br>');
		if ($input.val() === value) return;
		$input.val(value).change();
	}

	// устанавливает значение поля "карточка"
	// более не используется, но оставлено для обратной совместимости
	// и для того, чтобы оставался стобец "выебри карточку" в общей таблице закзов
	cards(product) {
		const $input = $(`#${Order.intaro}_customFields_card`);
		$input.parent().hide();
		return;

		const card = product.properties.filter('[title*="карточк"]');
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
	async dopnikPurchasePrice(product) {
		if (!product.isDopnik) return;

		const $input = product.$.find('td.purchase-price input.purchase-price');
		const value = normalize.int($input.val());
		if (value > 0) return;
		if (value == product.db.purchase_price) return;

		$input.val(product.db.purchase_price).change();
		product.$.find('td.purchase-price button').trigger('click');
		console.log('Закупочная цена допника', value);
	}

	// сортирует товары по алфавиту
	sort() {
		this.observer.stop();

		// Создаём временные массивы для каждой группы товаров
		const catalogProducts = [];
		const dopnikProducts = [];
		const otherProducts = [];

		// Распределяем товары по группам
		self.get().forEach(product => {
			const item = { title: product.title, element: product.$.detach() };

			if (product.isCatalog && !product.isTransport) {
				if (product.isDopnik) {
					dopnikProducts.push(item);
				} else {
					catalogProducts.push(item);
				}
			} else {
				otherProducts.push(item);
			}
		});

		// Сортируем каждую группу по алфавиту
		catalogProducts.sort((a, b) => a.title.localeCompare(b.title));
		dopnikProducts.sort((a, b) => a.title.localeCompare(b.title));
		otherProducts.sort((a, b) => a.title.localeCompare(b.title));

		// Добавляем обратно в таблицу в нужном порядке
		const $table = self.$table();
		catalogProducts.forEach(item => $table.append(item.element));
		dopnikProducts.forEach(item => $table.append(item.element));
		otherProducts.forEach(item => $table.append(item.element));

		this.observer.start();
	}

	//остатки
	ostatki(product) {
		const $ostatki = product.$.find('.available-inventory-row');
		if (!$ostatki.length) return;

		// если остатков нет, то выводим 0
		if ($ostatki.find('.not-enough-to-reserve').length) $ostatki.html('0');
		$ostatki.html(`еще ${normalize.int($ostatki.text())} шт`);

		// если остатков бесконечно (> 100), то скрываем
		if (normalize.int($ostatki.find('[data-available-quantity]')?.attr('data-available-quantity')) || 999 > 100) $ostatki.hide();
	}


	// возвращает таблицу товаров
	static $table() {
		return $('#order-products-table');
	}

	// возвращает контейнеры товаровов
	static $get() {
		return self.$table().find('tbody');
	}

	// возвращает коллекцию данных о всех товарах в заказе
	static get() {
		return ProductsData.get();
	}
}

const self = ProductsRows;