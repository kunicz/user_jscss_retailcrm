import Order from '@pages/order';
import ProductsRows from '@modules/order/products/rows';
import ProductsDataRefresher from '@modules/order/products_data/refresher';
import { SKU_PODPISKA, SKU_DOPNIK, SKU_DONAT } from '@root/config';
import db from '@helpers/db';
import retailcrm from '@helpers/retailcrm_direct';
import normalize from '@helpers/normalize';
import ensure from '@helpers/ensure';

export default class ProductsData {
	static flowersCrm = [];

	static async init() {
		// получаем данные о товарах-цветах из CRM один раз до конца сессии
		await self.initFlowersCrm();
		// собираем данные по всем товарам в заказе
		await Promise.all(
			$.map(ProductsRows.$get(), async (node) => {
				await self.add(node);
			})
		);
	}

	// Возвращает все данные по товарам (из DOM)
	static get() {
		return $.map(ProductsRows.$get(), (node) => $(node).data('product')).filter(Boolean);
	}

	// Добавляет данные по товару и сохраняет их в .data('product')
	static async add(node) {
		const $product = ensure.jquery(node);
		const product = await self.build($product);
		$product.data('product', product);
		return product;
	}

	// Обновляет данные по товару или товарам
	static refresh(fields, products) {
		ProductsDataRefresher.refresh(fields, products);
	}

	// Собирает объект с данными по товару
	static async build($product, { productCrm = null, productDb = null } = {}) {
		if (!$product) throw new Error('Не передан аргумент $product');

		const data = {
			$: $product,
			id: self.getId($product),
			title: self.getTitle($product),
			index: self.getIndex($product),
			price: self.getPrice($product),
			purchasePrice: self.getPurchasePrice($product),
			quantity: self.getQuantity($product),
			isCatalog: !!$product.find('.image img').length,
			isFlower: self.flowersCrm.some(p => p.id == self.getId($product)),

			isTransport: false,
			isPodpiska: false,
			isDopnik: false,
			isDonat: false,
			db: null,
			crm: null,
			properties: null,
		};

		// Транспортировочное — сразу возвращаем
		if (data.title === 'Транспортировочное') {
			data.isCatalog = false;
			data.isTransport = true;
			return data;
		}

		if (!data.isCatalog) return data;

		// CRM
		if (!productCrm) productCrm = await self.getProductCrm($product);
		data.crm = productCrm;
		data.properties = self.getProperties($product);

		// DB
		if (!productDb) productDb = await self.getProductDb(productCrm);
		data.db = productDb;
		data.isPodpiska = productDb?.type === SKU_PODPISKA;
		data.isDopnik = productDb?.type === SKU_DOPNIK;
		data.isDonat = productDb?.type === SKU_DONAT;

		return data;
	}

	static getId($product) {
		return normalize.int($product.children('tr').attr('data-product-id'));
	}

	static getIndex($product) {
		return normalize.int($product.children('tr').attr('data-order-product-index'));
	}

	static getTitle($product) {
		return $product.find('.title a').text();
	}

	static getPrice($product) {
		return parseFloat($product.find('.order-price__initial-price__input').val());
	}

	static getPurchasePrice($product) {
		return parseFloat($product.find('.wholesale-price__input.purchase-price').val());
	}

	static getQuantity($product) {
		return parseFloat($product.find('.quantity input').val());
	}

	static getProperties($product) {
		return {
			$td: $product.find('td.properties-td'),
			$items: $product.find('.order-product-properties > span')
		};
	}

	static async getProductCrm($product) {
		const productsCrm = await retailcrm.get.products({
			filter: { ids: [self.getId($product)] }
		});
		return productsCrm[0];
	}

	static async getProductDb(productCrm) {
		if (!productCrm?.externalId) return null;

		return await db.table('products').get({
			where: {
				id: productCrm.externalId,
				shop_crm_id: Order.getShop().id
			},
			limit: 1
		});
	}

	static async initFlowersCrm() {
		if (self.flowersCrm.length) return;
		self.flowersCrm = await retailcrm.get.products.flowers();
	}
}

const self = ProductsData;
