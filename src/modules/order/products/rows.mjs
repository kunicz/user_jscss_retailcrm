import properties from '@modules/order/products/properties';
import Transport from '@modules/order/products/transport';
import { Order } from '@pages/order';
import { vehicleFormats } from '@src/mappings';
import normalize from '@helpers/normalize';
import db from '@helpers/db';
import dom from '@helpers/dom';
import retailcrm from '@helpers/retailcrm_direct';
import { SKU_PODPISKA, SKU_DOPNIK, SKU_DONAT } from '@root/config';

export class ProductsRows {
	static flowersCrm = null;

	constructor(order) {
		this.order = order;
		this.watcher = dom.watcher();
		this.$productsAll = [];
		this.productsCrm = [];
		this.productCrmIds = [];
		this.productsCatalog = [];
		this.$productsCatalog = [];
		this.productsCatalogIds = [];
		this.productsData = [];
	}

	async init() {
		await this.initProducts();
		await self.initFlowersCrm();
		await this.initProductsData();

		this.productsData.forEach(product => {
			if (product.isCatalog && !product.isTransport) {
				this.classes(product);
				this.auto(product);
				this.bukety(product);
				this.cards(product);
			}
			this.ostatki(product);
		});
		this.listen();
		this.sort();
		await this.transport();
	}

	// слушает изменения в таблице (добавление/удаление товаров)
	listen() {
		this.watcher
			.setType('both')
			.setTarget(self.$table()[0])
			.setSelector('tbody')
			.setCallback(async () => await this.initProducts())
			.start();
	}

	// собираем все данные по товарам отовсюду
	async initProducts() {
		//все товары в заказе
		this.$productsAll = self.$get();
		//console.log('productsAll', this.$productsAll);

		//их id в CRM
		this.productCrmIds = $.map(this.$productsAll, product => self.getId($(product)));
		//console.log('productCrmIds', this.productCrmIds);

		//данные по ним из CRM
		this.productsCrm = await retailcrm.get.products({ filter: { ids: this.productCrmIds } });
		//console.log('productsCrm', this.productsCrm);

		//каталожные товары
		this.productsCatalog = this.productsCrm.filter(product => product.url);
		//console.log('productsCatalog', this.productsCatalog);

		//их id
		this.productsCatalogIds = this.productsCatalog.map(product => product.id);
		//console.log('productsCatalogIds', this.productsCatalogIds);

		//только каталожные товары в заказе
		this.$productsCatalog = $(this.$productsAll).filter((_, product) => this.productsCatalogIds.includes(self.getId($(product))));
		//console.log('productsCatalog', this.$productsCatalog);
	}

	// собираем все данные по товарам отовсюду
	async initProductsData() {
		this.productsData = await self.getProductsData(this.$productsAll, this.productsCrm);
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

	// если нет транспортировочного, то добавляем его, если есть - то обрабатываем
	async transport() {
		const product = this.productsData.find(product => product.isTransport);
		product ? new Transport({ product }).init() : new Transport({ watcher: this.watcher }).add();
	}

	// проверяет, нужен ли курьер на автомобиле
	isAuto(product) {
		if (!product.isCatalog) return false;

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

		if (!product.isCatalog) return;

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

		if (!product.isCatalog) return;

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

	// логика в работе со свойствами товара
	properties(product) {
		properties(product);
	}

	// сортирует товары по алфавиту
	sort() {
		this.watcher.stop();

		// Создаём временные массивы для каждой группы товаров
		const catalogProducts = [];
		const dopnikProducts = [];
		const otherProducts = [];

		// Распределяем товары по группам
		this.productsData.forEach(product => {
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

		this.watcher.start();
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


	// получает актуальные товары в заказе
	static $table() {
		return $('#order-products-table');
	}

	static $get() {
		return self.$table().find('tbody');
	}

	// получает id товара
	static getId($product) {
		return normalize.int($product.children('tr').attr('data-product-id'));
	}

	// id покупки за все время
	static getIndex($product) {
		return normalize.int($product.children('tr').attr('data-order-product-index'))
	}

	// получает название товара
	static getTitle($product) {
		return $product.find('.title a').text();
	}

	// получает цену товара
	static getPrice($product) {
		return parseFloat($product.find('.order-price__initial-price__input').val());
	}

	// получает закупочную цену товара
	static getPurchasePrice($product) {
		return parseFloat($product.find('.wholesale-price__input.purchase-price').val());
	}

	// получает количество товара
	static getQuantity($product) {
		return parseFloat($product.find('.quantity input').val());
	}

	// получает свойства товара
	static getProperties($product) {
		return {
			$td: $product.find('td.properties-td'),
			$items: $product.find('.order-product-properties > span')
		}
	}

	// получает данные товаров
	static async getProductsData($products = self.$get(), productsCrm = []) {
		const productsData = [];
		await Promise.all($.map($products, async (product) => {
			const $product = $(product);
			const productId = self.getId($product);
			const productCrm = productsCrm.find(p => p.id === productId);
			const productData = await self.getProductData($product, { productCrm });
			productsData.push(productData);
		}));
		return productsData;
	}

	// получает данные по товару
	static getProductData(...args) {
		let [$product, { productCrm = null, productDb = null } = {}] = args;
		if (!$product) throw new Error('Не передан аргумент $product');

		return (async () => {
			if (!productCrm) productCrm = await self.getProductCrm($product);
			if (!productDb) productDb = await self.getProductDb(productCrm);
			//console.log(productCrm);
			//console.log(productDb);

			const produtcData = {}

			produtcData['$'] = $product;
			produtcData.db = productDb;
			produtcData.crm = productCrm;
			produtcData.id = productCrm.id;
			produtcData.title = productCrm.name;
			produtcData.index = self.getIndex($product);
			produtcData.price = self.getPrice($product);
			produtcData.purchasePrice = self.getPurchasePrice($product);
			produtcData.quantity = self.getQuantity($product);
			produtcData.properties = self.getProperties($product);
			produtcData.isTransport = productCrm.url?.includes('transportirovochnoe') || false;
			produtcData.isCatalog = ($product.find('.image img').length && !produtcData.isTransport) || false;
			produtcData.isPodpiska = productDb?.type == SKU_PODPISKA;
			produtcData.isDopnik = productDb?.type == SKU_DOPNIK;
			produtcData.isDonat = productDb?.type == SKU_DONAT;
			produtcData.isFlower = self.getFlowersCrm().some(p => p.id === productCrm.id);

			return produtcData;
		})();
	}

	// получает объект товара из CRM
	static async getProductCrm($product) {
		const productsCrm = await retailcrm.get.products({
			filter: { ids: [self.getId($product)] }
		});
		return productsCrm[0];
	}

	// получает объект товара из БД
	static async getProductDb(productCrm) {
		if (!productCrm?.externalId) return null;
		const productDb = await db.table('products').get({
			where: {
				id: productCrm.externalId,
				shop_crm_id: Order.getShop().id
			},
			limit: 1
		});
		return productDb;
	}

	// получает массив товаров цветков из CRM
	static getFlowersCrm() {
		return self.flowersCrm || [];
	}
	static async initFlowersCrm() {
		self.flowersCrm = await retailcrm.get.products.flowers();
		return self.flowersCrm;
	}

}

const self = ProductsRows;
export default (order) => new self(order).init();