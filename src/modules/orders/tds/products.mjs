import * as cols from '@modules/orders/cols';
import { iconsSVG } from '@src/mappings';
import copyBtn from '@helpers/clipboard';
import nbsp from '@helpers/nbsp';
import { inlineTooltip } from '@src/helpers';
import OrdersTable from '@modules/orders/table';
import OrderTd from '@modules/orders/td';
import { SKU_TRANSPORT, SKU_DOPNIK } from '@root/config';

export default class ProductsTd extends OrderTd {
	static columnName = 'products';
	static colorClasses = new Map([
		[/ярк/i, 'bright'],
		[/нежн/i, 'soft'],
		[/т[её]мн/i, 'dark'],
		[/солнечн/i, 'sunny'],
		[/светл/i, 'light'],
		[/красн/i, 'red'],
		[/бел/i, 'white'],
		[/розов/i, 'pink'],
		[/ж[её]лт/i, 'yellow'],
		[/зелен/i, 'green'],
		[/сини/i, 'blue'],
		[/фиолет/i, 'purple'],
		[/белы/i, 'white']
	]);
	static propsColor = ['gamma', 'viebri-gammu', 'tsvet', 'viebri-tsvet', 'kakoy-tsvet'];
	static propsToExclude = ['artkul', 'viebri-kartochku', 'tsena', 'moyskladid', 'for-mat'];

	constructor(row) {
		super(row);
		this.productsAll = this.orderCrm?.items || [];
		this.productsNoCatalog = this.productsAll.filter(p => !p.offer?.article);
		this.productsCatalog = this.productsAll.filter(p => p.offer?.article && p.offer.article != SKU_TRANSPORT);
		this.productsNoFlowers = OrdersTable.noFlowers;
		this.productsFlowers = this.getFlowers();
	}

	init() {
		this.products();
		this.sostav();
		this.lovix();
	}

	// выводит товары в заказе
	products() {
		const items = this.productsCatalog
			.map(p => this.product(p))
			.sort((a, b) => {
				if (a.isDopnik !== b.isDopnik) return a.isDopnik ? 1 : -1;
				return a.name.localeCompare(b.name);
			});

		this.$native.html(items.map(i => `
			<div class="product">
				${i.color.class ? `<div class="color ${i.color.class}"><span>${i.color.value}</span></div>` : ''}
				<span class="name">${nbsp.numStr(i.name)} (${nbsp.strStr(i.quantity)})</span>
			</div>
		`).join(''));
	}

	// возвращает объект с данными о товаре
	product(p) {
		const item = {
			name: p.offer.displayName,
			quantity: p.quantity + ' шт',
			isDopnik: p.properties.artikul?.value?.startsWith(SKU_DOPNIK),
			props: {},
			color: {}
		};

		Object.entries(p.properties || {}).map(([code, prop]) => {
			if (ProductsTd.propsColor.includes(code)) item.color = prop;
			else if (!ProductsTd.propsToExclude.includes(code)) item.props[code] = prop.value;
		});

		const coloredItem = this.color(item);
		return coloredItem;
	}

	// добавляет класс к цвету товара
	color(item) {
		const propColor = ProductsTd.propsColor.find(p => p === item.color.code);
		if (!propColor) return item;

		item.color.class = 'default';
		for (const [regex, className] of ProductsTd.colorClasses) {
			if (regex.test(item.color.value)) {
				item.color.class = className;
				break;
			}
		}
		return item;
	}

	// выводит состав цветов в кликабельную кнопку
	sostav() {
		const flowers = [...new Set(this.productsFlowers.map(p => {
			let flower = p.offer.displayName;
			flower = flower.replace(/\s*—.*$/, '');
			flower = flower.replace(/\sодн|\sкуст/, '');
			flower = flower.replace(/\s-\s.*$/, '');
			flower = flower.replace(/\s\d*$/, '');
			flower = flower.replace(/(?:стабилизированный|стаб)/, 'стаб.');
			flower = flower.replace(/Роза(.*)/, 'Роза');
			flower = flower.trim();
			return flower;
		}))];
		if (!flowers.length) return;

		const flowersString = flowers.sort().join(', ');
		const $copyBtn = copyBtn(flowersString);
		$copyBtn.appendTo(this.$td);
		inlineTooltip($copyBtn, flowersString);
	}

	// фильтрует некаталожные товары, возвращает только цветы
	getFlowers() {
		if (!this.productsNoCatalog?.length) return [];

		return this.productsNoCatalog.filter(product =>
			!this.productsNoFlowers.some(noFlower =>
				noFlower.offers.some(offer => offer.id === product.offer.id)
			)
		);
	}

	// добавляет метку о необходимости добавить смазку
	lovix() {
		if (!this.row.get(cols.lovix)) return;
		this.$td.append(iconsSVG.lovixlube);
	}
}