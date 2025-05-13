import hash from '@helpers/hash';
import Popup from '@modules/popup/popup_order_properties';
import Order from '@pages/order';
import observers from '@helpers/observers';

export default class Properties {
	constructor(product) {
		this.product = product;
		this.popup = new Popup();
		this.required = [
			'for-mat',
			'artikul',
			'sku',
			'tsena',
			'moyskladid'
		];
		this.observer = observers.add('order', 'properties');
	}

	init() {
		this.listen();
		this.addMissingProperties();
		this.popup.init();
	}

	destroy() {
		this.observer = null;
		this.product = null;
		this.popup.destroy();
	}

	listen() {
		this.observer
			.setTarget(this.product.properties.$td)
			.onMutation(() => this.product?.update())
			.once()
			.start();
	}

	// проверяет, необходимо ли добавлять свойства в каталожный товар
	// и если необходимо, то добавляет
	async addMissingProperties() {
		if (!this.product.isCatalog) return;
		if (this.hasAllRequiredFields()) return;

		this.addProperties();
	}

	// проверяет, есть ли уже все обязательные для каталожного товара свойства
	hasAllRequiredFields() {
		return this.required.every(field => this.product.$.find(`#${Order.intaro}_orderProducts_${this.product.index}_properties_${field}_value`).length);
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
					if (this.product.crm.offers.length > 1) value = value.split(' - ').pop();
					return value;
				}
			},
			{
				code: 'sku',
				name: 'артикул вариации товара',
				getValue: () => this.product.crm.offers.find(offer => offer.name === this.product.title)?.article
			},
			{
				code: 'artikul',
				name: 'артикул товара',
				getValue: () => this.product.crm.offers.find(offer => offer.name === this.product.title)?.article.split('-')[0]
			},
			{
				code: 'tsena',
				name: 'цена',
				getValue: () => this.product.crm.offers.find(offer => offer.name === this.product.title)?.price
			},
			{
				code: 'moyskladid',
				name: 'мойсклад id',
				getValue: () => hash.timestamp()
			}
		];

		for (const config of propertyConfigs) {
			const selector = `#${Order.intaro}_orderProducts_${this.product.index}_properties_${config.code}_value`;

			//пропускаем, если:
			if (this.product.$.find(selector).length) continue; // свойство уже есть
			if (this.product.isDonat || this.product.isDopnik) continue; // донат или допник

			index++;
			const value = config.getValue();
			this.addPproperty(
				config.code, // код опции (for-mat)
				config.name, // название опции (фор мат)
				value, // значение опции
				index, // порядковый номер опции
				this.product.index, // индекс продажи (aka покупки) среди всех товаров за все время
				this.product.properties.$td // родительский объект, к которому крепим
			);
			console.log('Добавлено свойство', config.code, ':', value);
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
}
