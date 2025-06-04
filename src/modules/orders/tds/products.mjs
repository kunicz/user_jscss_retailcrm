import * as cols from '@modules/orders/cols';
import { iconsSVG } from '@src/mappings';
import copyBtn from '@helpers/clipboard';
import { space } from '@helpers/text';
import { inlineTooltip } from '@src/helpers';
import OrdersTable from '@modules/orders/table';
import OrderTd from '@modules/orders/td';
import { ARTIKUL_TRANSPORT, ARTIKUL_DOPNIK } from '@root/config';
import { moysklad } from '@src/mappings';
import ProductsData from '@modules/order/products/data';

export default class ProductsTd extends OrderTd {
	static columnName = 'products';
	static propsColor = ['gamma', 'viebri-gammu', 'tsvet', 'viebri-tsvet', 'kakoy-tsvet'];
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

	constructor(row) {
		super(row);
		this.productsAll = this.orderCrm?.items || [];
		this.productsNoCatalog = this.productsAll.filter(p => !p.offer?.article);
		this.productsCatalog = this.productsAll.filter(p => p.offer?.article && p.offer.article != ARTIKUL_TRANSPORT);
		this.productsNoFlowers = OrdersTable.noFlowers;
		this.productsFlowers = this.getFlowers();
	}

	init() {
		this.products();
		this.sostav();
		this.lovix();
	}

	// выводит каталожные товары в заказе
	async products() {
		this.$native.html('');

		const items = await Promise.all(
			this.productsCatalog.map(async (p) => await this.product(p))
		);

		items.sort((a, b) => {
			if (a.isDopnik !== b.isDopnik) return a.isDopnik ? 1 : -1;
			return a.name.localeCompare(b.name);
		});

		items.forEach(item => {
			const $div = $('<div class="product"></div>');
			$div.appendTo(this.$native);

			// если у товара есть цветовая разновидность, то добавляем ее в div
			if (item.color?.class) {
				$div.append(`<div class="color ${item.color.class}"><span>${item.color.value}</span></div>`);
			}
			const $span = $(`<span class="name"></span>`);
			$span.append(name(item)).appendTo($div);
		});

		// возвращает имя товара:
		// - в виде строки, если нет moyskladid
		// - в виде ссылки на мойсклад, если есть
		// если свойство есть, а самого заказа в моем складе еще нет (новый, ни разу не сохраненный), то уничтожаем ссылку
		function name(item) {
			const title = `${space.numNbspStr(item.name)} (${space.strNbspStr(item.quantity)})`;
			if (!item.props.moyskladid) return title;

			let loaded = false;
			const $a = $('<a class="moysklad" href="#" target="_blank">');
			$a.append(title);
			$a.on('mouseenter', async () => {
				if (loaded) return;
				loaded = true;
				const orderMs = await ProductsData.productMs(item.props.moyskladid);
				const msId = orderMs?.id;
				if (!msId) {
					const text = $a.text();
					$a.replaceWith(document.createTextNode(text));
				} else {
					$a.attr('href', `${moysklad.orderUrl}${msId}`);
				}
			});
			return $a;
		}
	}

	// возвращает объект с данными о товаре
	async product(p) {
		const item = {
			name: p.offer.displayName,
			quantity: p.quantity + ' шт',
			isDopnik: p.properties.artikul?.value?.startsWith(ARTIKUL_DOPNIK),
			props: {},
			color: {},
		};

		// перебираем свойства товара
		Object.entries(p.properties || {}).map(([code, prop]) => {
			// цветовые свойства
			if (self.propsColor.includes(code)) item.color = prop;
			// остальные свойства
			else item.props[code] = prop.value;
		});

		// добавляем class к цвету
		if (item.color.code) {
			const propColor = self.propsColor.find(p => p === item.color.code);
			if (propColor) {
				for (const [regex, className] of self.colorClasses) {
					if (regex.test(item.color.value)) {
						item.color.class = className;
						break;
					}
				}
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
		const $copyBtn = copyBtn(flowersString, '');
		$copyBtn.lastTo(this.$td);
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

const self = ProductsTd;
