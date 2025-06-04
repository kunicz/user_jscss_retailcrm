import RootClass from '@helpers/root_class';
import Order from '@pages/order';
import { ARTIKUL_PODPISKA, ARTIKUL_DOPNIK, ARTIKUL_DONAT } from '@root/config';
import db from '@helpers/db';
import retailcrm from '@helpers/retailcrm_direct';
import normalize from '@helpers/normalize';
import { php2steblya } from '@helpers/api';

export default class ProductsData extends RootClass {
	constructor($product) {
		super();

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
			await this._crm();
			await this._db();
			await this._ms();
		}
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

	async _crm() {
		if (this.crm) return;
		this.crm = await self.productCrm(this.id);
	}

	async _db() {
		if (this.db) return;
		if (!this.crm.externalId) return;

		this.db = await self.productDb(this.crm.externalId);
		if (!this.db) return;

		this.isPodpiska = this.db?.type == ARTIKUL_PODPISKA;
		this.isDopnik = this.db?.type == ARTIKUL_DOPNIK;
		this.isDonat = this.db?.type == ARTIKUL_DONAT;
	}

	async _ms() {
		if (this.ms) return;
		if (this.isDopnik || this.isDonat) return;

		const moyskladid = this.properties.items.find(p => p.code === 'moyskladid')?.value;
		if (moyskladid) this.ms = await self.productMs(moyskladid);

	}

	static async productCrm(id) {
		const response = await retailcrm.get.products({ filter: { ids: [id] } });
		return response[0];
	}

	static async productDb(id) {
		const response = await db.table('products').get({
			where: {
				id: id,
				shop_crm_id: Order.getShop().id
			},
			limit: 1
		});
		return response;
	}

	static async productMs(id) {
		const data = { filter: { externalCode: id } };
		const response = await php2steblya('Moysklad', 'orders/get').fetch(data);
		return response?.rows[0];
	}
}

const self = ProductsData;