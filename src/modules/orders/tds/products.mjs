import OrdersTd from '@modules/orders/td';
import Product from '@modules/orders/product';
import { iconsSVG } from '@src/mappings';
import copyBtn from '@helpers/clipboard';
import { inlineTooltip } from '@src/helpers';
import dom from '@helpers/dom';

export default class ProductsTd extends OrdersTd {
	static columnName = 'products';

	constructor(td) {
		super(td);
		this.products = this.crm.items;
		this.productsCatalog = [];
		this.productsNoCatalog = [];
	}

	init() {
		this.td.empty();
		this.productsInit();
		this.sort();
		this.display();
		this.sostav();
		this.lovix();
	}

	// выводит каталожные товары в заказе
	productsInit() {
		if (!this.products) return;
		for (const item of this.products) new Product(item).init(); // наполняем item полезными свойствами
		this.productsCatalog = this.products.filter(item => item.isCatalog);
		this.productsNoCatalog = this.products.filter(item => !item.isCatalog);
	}

	// сортирует каталожные товары
	// допники всегда после сборных
	sort() {
		this.productsCatalog.sort((itema, itemb) => {
			if (itema.isDopnik !== itemb.isDopnik) return itema.isDopnik ? 1 : -1;
			return itema.offer.name.localeCompare(itemb.offer.name);
		});
	}

	// добавляем отображение продукта в дом
	display() {
		this.productsCatalog.forEach(item => this.td.toLast(item.display));
	}

	// выводит состав цветов в кликабельную кнопку
	sostav() {
		const flowers = this.productsNoCatalog
			.filter(item => item.isFlower)
			.map(item => {
				let flower = item.offer.displayName;
				flower = flower.replace(/\s*—.*$/, '');
				flower = flower.replace(/\sодн|\sкуст/, '');
				flower = flower.replace(/\s-\s.*$/, '');
				flower = flower.replace(/\s\d*.*$/, '');
				flower = flower.replace(/Роза(.*)/, 'Роза');
				flower = flower.trim();
				return flower;
			});
		if (!flowers.length) return;

		const flowersString = flowers.sort().join(', ');
		const btn = copyBtn(flowersString, '');
		btn.lastTo(this.td);
		inlineTooltip(btn, flowersString);
	}

	// добавляет метку о необходимости добавить смазку
	lovix() {
		if (!this.crm.customFields?.lovix) return;
		this.td.toLast(iconsSVG.lovixlube);
	}
}
OrdersTd.registerClass(ProductsTd);