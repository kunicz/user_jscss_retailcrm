import hash from '@helpers/hash';
import retailcrm from '@helpers/retailcrm_direct';
import propertiesPopup from '@modules/order/products/popup/properties';
import { Order } from '@pages/order';

export default (product, order) => new Properties(product, order);

class Properties {
	static required = [
		'for-mat',
		'artikul',
		'tsena',
		'moyskladid'
	];

	constructor(product, order) {
		this.product = product;
		this.order = order;
		this.productCrm = {};
	}

	init() {
		this.addMissingProperties();
		this.prepertiesPopup();
	}

	// проверяет, необходимо ли добавлять свойства в каталожный товар
	// и если необходимо, то добавляет
	async addMissingProperties() {
		if (!this.product.isCatalog) return;
		if (this.hasAllRequiredFields()) return;

		this.productCrm = await retailcrm.get.product.byId(this.product.id);
		if (!this.productCrm) return;

		this.addProperties();
	}

	// проверяет, есть ли уже все обязательные для каталожного товара свойства
	hasAllRequiredFields() {
		return Properties.required.every(field => this.product.$.find(`#${Order.intaro}_orderProducts_${this.product.index}_properties_${field}_value`).length);
	}

	// добавляет обязательныесвойства в каталожный товар
	async addProperties() {
		let index = this.product.properties.$items.length;
		const propertyConfigs = [
			{
				code: 'for-mat',
				name: 'фор мат',
				getValue: () => {
					let value = this.product.title;
					if (this.productCrm.offers.length > 1) value = value.split(' - ').pop();
					return value;
				}
			},
			{
				code: 'artikul',
				name: 'артикул',
				getValue: () => this.productCrm.offers.find(offer => offer.name === this.product.title)?.article
			},
			{
				code: 'tsena',
				name: 'цена',
				getValue: () => this.productCrm.offers.find(offer => offer.name === this.product.title)?.price
			},
			{
				code: 'moyskladid',
				name: 'мойсклад id',
				getValue: () => hash.timestamp()
			}
		];

		for (const config of propertyConfigs) {
			const selector = `#${Order.intaro}_orderProducts_${this.product.index}_properties_${config.code}_value`;
			if (this.product.$.find(selector).length) continue;

			index++;
			addPproperty(
				config.code, // код опции (for-mat)
				config.name, // название опции (фор мат)
				config.getValue(), // значение опции
				index, // порядковый номер опции
				this.product.index, // индекс продажи (aka покупки) среди всех товаров за все время
				this.product.properties.$items.parent() // родительский объект, к которому крепим
			);
			console.log('Добавлено свойство', config.code)
		}
	}

	// добавляет свойство в товар
	addPproperty(code, name, value, index, productIndex, block) {
		// скрытое
		$(`
		<div data-index="${index}" class="order-product-property-hidden" style="display:none">
			<div class="property-field-code">
				<input type="hidden" id="intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_${code}_code" name="intaro_crmbundle_ordertype[orderProducts][${productIndex}][properties][${code}][code]" autocomplete="disabled" value="${code}">
			</div>
			<div class="property-field-name">
				<div class="value">
					<input type="text" id="intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_${code}_name" name="intaro_crmbundle_ordertype[orderProducts][${productIndex}][properties][${code}][name]" required="required" autocomplete="disabled" value="${name}">
				</div>
			</div>
			<div class="property-field-value">
				<div class="value">
					<input type="text" id="intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_${code}_value" name="intaro_crmbundle_ordertype[orderProducts][${productIndex}][properties][${code}][value]" required="required" autocomplete="disabled" value="${value}">
				</div>
			</div>
		</div>`).appendTo(block);

		//видимое
		$(`
		<span class="additional ellipsis edit" data-index="${index}" title="${name}: ${value}">
			<span>${name}</span>
			${value}
		</span>`).appendTo(block.find('.order-product-properties'));
	}

	// логика для всплывающего окна свойств
	async prepertiesPopup() {
		propertiesPopup();
	}
}
