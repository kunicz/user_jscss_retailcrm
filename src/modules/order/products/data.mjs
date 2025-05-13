import Order from '@pages/order';
import { ARTIKUL_PODPISKA, ARTIKUL_DOPNIK, ARTIKUL_DONAT } from '@root/config';
import db from '@helpers/db';
import retailcrm from '@helpers/retailcrm_direct';
import normalize from '@helpers/normalize';
import { php2steblya } from '@helpers/api';

export default class ProductsData {
	constructor($product) {
		this.$ = $product;
		this.$container = $product.parent('tbody');
		this.id = this._id();
		this.offerId = this._offerId();
		this.title = this._title();
		this.index = this._index();
		this.price = this._price();
		this.purchasePrice = this._purchasePrice();
		this.quantity = this._quantity();
		this.properties = this._properties();
		this.isCatalog = !!this.$.find('.image img').length;
		this.isFlower = Order.flowersCrm.some(p => p.id == this.id);
		this.isTransport = this.title === 'Транспортировочное';
		this.isPodpiska = false;
		this.isDopnik = false;
		this.isDonat = false;
		this.crm = null;
		this.db = null;
		this.ms = null;
	}

	// инициализирует данные по товару
	async init() {
		if (this.isCatalog) {
			//crm
			this.crm = await self.productCrm(this.id);

			//db
			if (this.crm?.externalId) {
				this.db = await self.productDb(this.crm.externalId);
			}

			//ms
			if (!this.isDopnik && !this.isDonat) {
				const moyskladid = this.properties.items.find(p => p.code === 'moyskladid')?.value;
				if (moyskladid) this.ms = await self.productMs(moyskladid);
			}
		}
		this.store();
	}

	destroy() {
		this.$?.removeData('product');
		this.$ = null;
		this.$container = null;
		this.id = null;
		this.offerId = null;
		this.title = null;
		this.index = null;
		this.price = null;
		this.purchasePrice = null;
		this.quantity = null;
		this.properties = null;
		this.isCatalog = null;
		this.isFlower = null;
		this.isTransport = null;
		this.isPodpiska = null;
		this.isDopnik = null;
		this.isDonat = null;
		this.crm = null;
		this.db = null;
		this.ms = null;
	}

	// обновляет данные по товару
	update() {
		this.index = this._index();
		this.price = this._price();
		this.purchasePrice = this._purchasePrice();
		this.quantity = this._quantity();
		this.properties = this._properties();
		this.store();
	}

	// сохраняет данные по товару в DOM
	store() {
		this.$.data('product', this);
	}

	_id() {
		return normalize.int(this.$.data('product-id'));
	}

	_offerId() {
		return normalize.int(this.$.data('offer-id'));
	}

	_index() {
		return normalize.int(this.$.data('order-product-index'));
	}

	_title() {
		return this.$.find('.title a').text();
	}

	_price() {
		return parseFloat(this.$.find('.order-price__initial-price__input').val());
	}

	_purchasePrice() {
		return parseFloat(this.$.find('.wholesale-price__input.purchase-price').val());
	}

	_quantity() {
		return parseFloat(this.$.find('.quantity input').val());
	}

	_properties() {
		const props = {
			items: [],
			$td: this.$.find('td.properties-td[data-offer-name]'),
			$items: this.$.find('.order-product-properties-hidden > div'),
		}
		props.$items.each((_, item) => {
			const $item = $(item);
			props.items.push({
				index: $item.data('index'),
				code: $item.find('.property-field-code input').val(),
				name: $item.find('.property-field-name input').val(),
				value: $item.find('.property-field-value input').val(),
			});
		});
		return props;
	}

	static async productCrm(id) {
		const response = await retailcrm.get.products({
			filter: { ids: [id] }
		});
		return response[0];
	}

	static async productDb(externalId) {
		if (!externalId) return;

		const response = await db.table('products').get({
			where: {
				id: externalId,
				shop_crm_id: Order.getShop().id
			},
			limit: 1
		});

		this.isPodpiska = response?.type == ARTIKUL_PODPISKA;
		this.isDopnik = response?.type == ARTIKUL_DOPNIK;
		this.isDonat = response?.type == ARTIKUL_DONAT;

		return response;
	}

	static async productMs(moyskladid) {
		if (this.isDonat || this.isDopnik) return;

		const data = { filter: { externalCode: moyskladid } };
		const response = await php2steblya('Moysklad', 'orders/get').fetch(data);
		return response?.rows[0];
	}
}

const self = ProductsData;