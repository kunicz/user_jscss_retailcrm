import hash from '@helpers/hash';
import retailcrm from '@helpers/retailcrm_direct';
import { getProductId } from '@modules/order/products';

export async function properties($product) {
	if (!$product.is('.catalog')) return;

	const productData = extractProductData($product);
	if (!productData) return;

	if (hasAllRequiredFields(productData)) return;

	const productCrm = await retailcrm.get.product.byId(productData.productId);
	if (!productCrm) return;

	await addMissingProperties(productData, productCrm);
}

function extractProductData($product) {
	const $tr = $product.children('tr');
	return {
		$product,
		$block: $product.find('td.properties-td'),
		productId: $tr.attr('data-product-id'),
		productIndex: $tr.attr('data-order-product-index'),
		productTitle: $product.find('.title a').text().trim(),
		index: $product.find('.order-product-properties > span').length
	};
}

function hasAllRequiredFields({ $product, productIndex }) {
	const requiredFields = [
		'for-mat',
		'artikul',
		'tsena',
		'moyskladid'
	];
	return requiredFields.every(field => $product.find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_${field}_value`).length);
}

async function addMissingProperties(productData, productCrm) {
	const propertyConfigs = [
		{
			code: 'for-mat',
			name: 'фор мат',
			getValue: () => {
				let value = productData.$product.find('.title a').text();
				if (productCrm.offers.length > 1) value = value.split(' - ').pop();
				return value;
			}
		},
		{
			code: 'artikul',
			name: 'артикул',
			getValue: () => productCrm.offers.find(offer => offer.name === productData.productTitle)?.article
		},
		{
			code: 'tsena',
			name: 'цена',
			getValue: () => productCrm.offers.find(offer => offer.name === productData.productTitle)?.price
		},
		{
			code: 'moyskladid',
			name: 'мойсклад id',
			getValue: () => hash.timestamp()
		}
	];

	for (const config of propertyConfigs) {
		const selector = `#intaro_crmbundle_ordertype_orderProducts_${productData.productIndex}_properties_${config.code}_value`;
		console.log(selector);
		if (productData.$product.find(selector).length) continue;
		console.log('add');
		productData.index++;
		addPproperty(
			config.code,
			config.name,
			config.getValue(),
			productData.index,
			productData.productIndex,
			productData.$block
		);
	}
}

function addPproperty(code, name, value, index, productIndex, block) {
	//code - код опции (for-mat)
	//title - транслитерация field (фор мат)
	//value - значение
	//index - порядковый номер опции
	//productIndex - индекс продажи (aka покупки) среди всех товаров за все время
	//block - родительский объект, к которому крепим

	//невидимое
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

export async function prepertiesPopup() {

}
