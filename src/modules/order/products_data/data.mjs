import { Order } from '@pages/order';
import { ProductsRows as Products } from '@modules/order/products/rows';
import { ProductsDataRefresher } from '@modules/order/products_data/refresher';
import { SKU_PODPISKA, SKU_DOPNIK, SKU_DONAT } from '@root/config';
import db from '@helpers/db';
import retailcrm from '@helpers/retailcrm_direct';
import normalize from '@helpers/normalize';

class Data {
	static data = new Map();
	static flowersCrm = [];

	// собираем все данные по товарам отовсюду
	static async init() {
		await self.initFlowersCrm();
		await Promise.all($.map(Products.$get(), async (product) => self.add(product)));
	}

	// получает все данные по товарам в виде массива
	static get() {
		return [...this.data.values()];
	}

	// добавляет данные по товару в data и возвращает их
	static async add(product) {
		if (product.jquery) product = product.get(0);
		//if (self.data.has(product)) return self.data.get(product);
		const data = await self.build($(product));
		self.data.set(product, data);
		return data;
	}

	// обновляет данные по товару или товарам
	static refresh(fields, products) {
		ProductsDataRefresher.refresh(fields, products);
	}

	// удаляет данные по товару из data
	static delete(product) {
		if (product.jquery) product = product.get(0);
		if (!self.data.has(product)) return;
		self.data.delete(product);
	}

	// получает данные по товару
	static build(...args) {
		let [$product, { productCrm = null, productDb = null } = {}] = args;
		if (!$product) throw new Error('Не передан аргумент $product');

		return (async () => {
			const data = {
				// заполняем всем, что можно достать из DOM ($product)
				$: $product,
				id: self.getId($product),
				title: self.getTitle($product),
				index: self.getIndex($product),
				price: self.getPrice($product),
				purchasePrice: self.getPurchasePrice($product),
				quantity: self.getQuantity($product),
				isCatalog: !!$product.find('.image img').length,
				isFlower: self.flowersCrm.some(p => p.id === self.getId($product)),

				//остальные поля оставляем пустыми
				isTransport: false,
				isPodpiska: false,
				isDopnik: false,
				isDonat: false,
				db: null,
				crm: null,
				properties: null,
			};

			//Транспортировочное
			if (data.title === 'Транспортировочное') {
				data.isCatalog = false;
				data.isTransport = true;

				return data;
			}

			// если не каталожный, то возвращаем сразу - нет смысла делать запросы к БД и CRM
			if (!data.isCatalog) return data;

			//CRM
			if (!productCrm) productCrm = await self.getProductCrm($product);
			//console.log(productCrm);
			data.crm = productCrm;
			data.properties = self.getProperties($product);


			//БД
			if (!productDb) productDb = await self.getProductDb(productCrm);
			//console.log(productDb);
			data.db = productDb;
			data.isPodpiska = productDb?.type == SKU_PODPISKA;
			data.isDopnik = productDb?.type == SKU_DOPNIK;
			data.isDonat = productDb?.type == SKU_DONAT;

			return data;
		})();
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
	static async initFlowersCrm() {
		if (self.flowersCrm.length) return;
		const flowers = await retailcrm.get.products.flowers();
		self.flowersCrm = flowers;
	}
}

const self = Data;
export const ProductsData = self;
