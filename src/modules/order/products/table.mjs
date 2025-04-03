import Popup from '@modules/popup/popup_order_products';
import ProductsRows from '@modules/order/products/rows';
import '@css/order_products.css';

export default class ProductsTable {
	async init() {
		this.fixTitle();
		new Popup().init();
		await new ProductsRows().init();
		this.sebes();
	}

	// исправляет название столбца "Товар или услуга" -> "Товар"
	fixTitle() {
		ProductsRows.$table().find('thead .title').text('Товар');
	}

	// добавляет кнопку "Посчитать по себесу"
	sebes() {
		$('<a id="sebes">Посчитать по себесу</a>').on('click', e => {
			e.preventDefault();
			ProductsRows.get().each((_, product) => {
				const $product = $(product);
				const $wholesalePrice = $product.find('.wholesale-price__input');
				$product.find('.order-price__initial-price__input').val($wholesalePrice.val()).change();
				$product.find('.order-price__apply').trigger('click');
			});
		}).prependTo($('#order-list .order-row__top:first-child'));
	}
}