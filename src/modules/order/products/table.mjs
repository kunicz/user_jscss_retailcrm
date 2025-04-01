import popupProducts from '@modules/order/popups/popup_products';
import { default as products, ProductsRows as Products } from '@modules/order/products/rows';
import '@css/order_products.css';

export default () => new ProductsTable().init();

class ProductsTable {
	async init() {
		this.fixTitle();
		popupProducts();
		await products();
		this.sebes();
	}

	// исправляет название столбца "Товар или услуга" -> "Товар"
	fixTitle() {
		Products.$table().find('thead .title').text('Товар');
	}

	// добавляет кнопку "Посчитать по себесу"
	sebes() {
		$('<a id="sebes">Посчитать по себесу</a>').on('click', e => {
			e.preventDefault();
			Products.$get().each((_, product) => {
				const $product = $(product);
				const $wholesalePrice = $product.find('.wholesale-price__input');
				$product.find('.order-price__initial-price__input').val($wholesalePrice.val()).change();
				$product.find('.order-price__apply').trigger('click');
			});
		}).prependTo($('#order-list .order-row__top:first-child'));
	}
}