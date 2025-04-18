import Popup from '@modules/popup/popup_order_products';
import ProductsRows from '@modules/order/products/rows';
import '@css/order_products.css';

export default class ProductsTable {
	static $ = null;

	constructor() {
		this.popup = new Popup();
		this.rows = new ProductsRows();
	}

	async init() {
		self.$ = $('#order-products-table');
		this.popup.init();
		await this.rows.init();
		this.sebes();
		this.title();
	}

	destroy() {
		self.$ = null;
		this.popup.destroy();
		this.rows.destroy();
		$('#sebes').off('click');
	}

	// исправляет название столбца "Товар или услуга" -> "Товар"
	title() {
		self.$thead().find('.title').text('Товар');
	}

	// добавляет кнопку "Посчитать по себесу"
	sebes() {
		$('<a id="sebes">Посчитать по себесу</a>').on('click', e => {
			e.preventDefault();
			self.$rows().each((_, tr) => {
				const $tr = $(tr);
				const $wholesalePrice = $tr.find('.wholesale-price__input');
				$tr.find('.order-price__initial-price__input').val($wholesalePrice.val()).change();
				$tr.find('.order-price__apply').trigger('click');
			});
		}).prependTo($('#order-list .order-row__top:first-child'));
	}

	// возвращает таблицу товаров
	static $table() { return self.$; }

	// возвращает заголовок таблицы
	static $thead() { return self.$table().children('thead'); }

	// возвращает строки таблицы товаров
	// строка - это tbody > tr, но работаем мы только с tr
	// в тех редких случаях, когда нужно работать именно с tbody, используй $tr.data('product').$container
	static $rows() { return ProductsRows.$trs(); }
}

const self = ProductsTable;