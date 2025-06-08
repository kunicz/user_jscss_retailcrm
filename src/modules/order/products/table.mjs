import RootClass from '@helpers/root_class';
import ProductsPopup from '@modules/order/products/popup_products';
import PropertiesPopup from '@modules/order/products/popup_properties';
import ProductsTbody from '@modules/order/products/tbody';
import wait from '@helpers/wait';
import dom from '@helpers/dom';
import { intaro } from '@modules/order/sections';
import '@css/order_products.css';

export default class ProductsTable extends RootClass {
	constructor() {
		super();
		this.table = null;
		// this.tbodies = null; // не надо, даже если хочется, так как я не храню состояние, используй this.table.childs('tbody')
	}

	async init() {
		this.table = await wait.element('table[id^="order-product-section"]');
		this.table = dom(this.table);
		await Promise.all(this.table.childs('tbody').map(tbody => new ProductsTbody(tbody).init()));
		this.sort();
		this.sebes();
		this.productsPopupButton();
		this.watchProducts();
		this.watchProductsPopup();
		this.watchPropertiesPopup();
	}

	// слушает изменения в таблице (добавление/удаление товаров)
	watchProducts() {
		this.setObserver()
			.setTarget(this.table)
			.setSelector('tbody')
			.onAdded(async tbody => {
				if (dom(tbody).is('.loaded')) return; // зачем? например, перетаскивание 
				await new ProductsTbody(tbody).init();
				this.sort();
			})
			.onRemoved(() => { })
			.start();
	}

	// слушает появление попапа с выбором товаров
	watchProductsPopup() {
		this.setObserver()
			.setSelector('[id^="order-product-section"]')
			.onAdded(async popup => {
				// убеждаемся, что это именно products_popup
				const isProductsPopup = await wait.check(() => dom(popup).has('[class*="product-tab"]'));
				if (!isProductsPopup) return;
				new ProductsPopup(popup).init();
			})
			.start();
	}

	// слушает появление попапа с выбором свойств товара
	watchPropertiesPopup() {
		this.setObserver()
			.setSelector('[id^="omnica-modal-window"]')
			.onAdded(async popup => {
				// убеждаемся, что это именно properties_popup
				const isPropertiesPopup = await wait.check(() => dom(popup).has('[id^="order-product-section"][class*="properties"]'));
				if (!isPropertiesPopup) return;
				new PropertiesPopup(popup).init();
			})
			.start();
	}

	// добавляет кнопку "Посчитать по себесу"
	sebes() {
		const btn = dom('<a id="sebes">Посчитать по себесу</a>');
		btn.firstTo(this.table.nextAll('[class^=row]')[0]);
		btn.listen('click', async () => {
			// всех сразу в .loading
			this.table.childs('tbody').forEach(tbody => tbody.addClass('loading'));
			// каждого по очереди обрабатываем
			for (const tbody of this.table.childs('tbody')) {
				const tr = tbody.child();
				const purchasePrice = tr.getPurchasePrice();
				const price = tr.getPrice();
				if (purchasePrice === price) {
					tr.parent().removeClass('loading');
					continue;
				}
				await tr.setPrice(purchasePrice);
				tr.parent().removeClass('loading');
			}
		});
	}

	// сортирует товары в таблице
	sort() {
		// создаём временные массивы для каждой группы товаров
		const catalogProducts = [];
		const dopnikProducts = [];
		const otherProducts = [];

		// распределяем товары по группам
		this.table.childs('tbody').forEach(tbody => {
			const tr = tbody.child();
			if (tr.isCatalog()) {
				if (tr.isDopnik()) {
					dopnikProducts.push(tbody);
				} else {
					catalogProducts.push(tbody);
				}
			} else {
				otherProducts.push(tbody);
			}
		});

		// сортируем каждую группу по алфавиту
		catalogProducts.sort((a, b) => a.child().getTitle().localeCompare(b.child().getTitle()));
		dopnikProducts.sort((a, b) => a.child().getTitle().localeCompare(b.child().getTitle()));
		otherProducts.sort((a, b) => a.child().getTitle().localeCompare(b.child().getTitle()));

		// добавляем обратно в таблицу в нужном порядке
		catalogProducts.forEach(tbody => this.table.toLast(tbody));
		dopnikProducts.forEach(tbody => this.table.toLast(tbody));
		otherProducts.forEach(tbody => this.table.toLast(tbody));
	}

	// логика работы кнопки "Добавить товар"
	// скрываем кнопку, если нет магазина и менеджера
	productsPopupButton() {
		const btn = dom('#order-list [class*="section__head"] button');
		btn.setInterval(() => {
			const conditions = [
				$(`#${intaro}_manager`).val(),
				$(`#${intaro}_site`).val(),
			];
			btn.toggle(!conditions.some(c => !c));
		}, 500);
	}
}