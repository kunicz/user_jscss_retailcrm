import RootClass from '@helpers/root_class';
import Popup from '@modules/popup/popup_order_products';
import ProductsRows from '@modules/order/products/rows';
import '@css/order_products.css';

export default class ProductsTable extends RootClass {
	static $ = null;

	constructor() {
		super();
		this.popup = new Popup();
		this.rows = new ProductsRows();
	}

	async init() {
		self.$ = $('table[id^=order-product-section]');
		this.popup.init();
		await this.rows.init();
		this.sebes();
		this.title();
	}

	// исправляет название столбца "Товар или услуга" -> "Товар"
	title() {
		self.$thead().find('.title').text('Товар');
	}

	// добавляет кнопку "Посчитать по себесу"
	sebes() {
		const $btn = $('<a id="sebes">Посчитать по себесу</a>');
		$btn.prependTo($('#order-list .order-row__top:first-child'));
		this.on({
			target: $btn[0],
			event: 'click',
			handler: (e) => {
				e.preventDefault();
				self.$rows().each((_, tr) => {
					const $tr = $(tr);
					const $wholesalePrice = $tr.find('.wholesale-price__input');
					$tr.find('.order-price__initial-price__input').val($wholesalePrice.val()).change();
					$tr.find('.order-price__apply').trigger('click');
				});
			}
		});
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