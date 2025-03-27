import popup from '@modules/order/products/popup/products';
import { default as products, ProductsRows as Products } from '@modules/order/products/rows';
import { rashod } from '@modules/order/finances';
import '@css/order_products.css';

export default (order) => new ProductsTable(order).init();

class ProductsTable {
	constructor(order) {
		this.order = order;
	}

	async init() {
		this.fixTitle();
		await this.products();
		this.sebes();
		this.rashod();
		this.popup();
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

	// логика работы с самими товарами в заказе
	async products() {
		await products(this.order);
	}

	// добавляет данные и затратах на цветок и нецветок в подвал таблицы
	rashod() {
		rashod();
	}

	// логика работы попапа для добавления товаров в заказ
	popup() {
		popup();
	}
}