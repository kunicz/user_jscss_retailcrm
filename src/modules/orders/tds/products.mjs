import OrdersTd from '@modules/orders/td';
import { iconsSVG } from '@src/mappings';
import copyBtn from '@helpers/clipboard';
import { space } from '@helpers/text';
import { inlineTooltip } from '@src/helpers';
import { ARTIKUL_TRANSPORT, ARTIKUL_DOPNIK } from '@root/config';
import { moysklad, noFlowers } from '@src/mappings';
import { php2steblya as api } from '@helpers/api';
import dom from '@helpers/dom';

export default class ProductsTd extends OrdersTd {
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
		[/оранж/i, 'orange'],
		[/персик/i, 'peach'],
	]);

	constructor(td) {
		super(td);
		this.productsNoCatalog = this.crm.items?.filter(p => !p.offer?.article);
		this.productsCatalog = this.crm.items?.filter(p => p.offer?.article && p.offer.article != ARTIKUL_TRANSPORT);
	}

	init() {
		this.td.empty();
		this.products();
		this.sostav();
		this.lovix();
	}

	// выводит каталожные товары в заказе
	async products() {
		const items = await Promise.all(this.productsCatalog.map(async (p) => await this.product(p)));
		items.sort((a, b) => {
			if (a.isDopnik !== b.isDopnik) return a.isDopnik ? 1 : -1;
			return a.name.localeCompare(b.name);
		});
		items.forEach(item => {
			const productCont = dom('<div class="product"></div>');
			// если у товара есть цветовая разновидность, то добавляем ее в div
			if (item.color?.class) productCont.toLast(`<div class="color ${item.color.class}"><span>${item.color.value}</span></div>`);
			productCont.toLast(name(item)).lastTo(this.td);
		});

		// возвращает имя товара:
		// - в виде строки, если нет moyskladid
		// - в виде ссылки на мойсклад, если есть
		// если свойство есть, а самого заказа в моем складе еще нет (новый, ни разу не сохраненный), то уничтожаем ссылку
		function name(item) {
			const title = `${space.numNbspStr(item.name)} (${space.strNbspStr(item.quantity)})`;
			const span = dom('<span/>');
			span.html(title);
			if (!item.props.moyskladid) return span;

			let loaded = false;
			const a = dom('<a class="moysklad" href="" target="_blank">');
			a.html(title);
			a.listen('mouseenter', async () => {
				if (loaded) return;
				loaded = true;
				const ms = await self.getMs(item.props.moyskladid);
				const msId = ms?.id;
				if (!msId) {
					const text = a.txt();
					a.parent().html(text);
				} else {
					a.attr('href', `${moysklad.orderUrl}${msId}`);
				}
			});
			return a;
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

		// ручное добавлеие класса
		// МА ЛЮ ТЯ
		if (item.color.value === 'курица-помада') item.color.class = 'pink';
		if (item.color.value === 'молочный суп') item.color.class = 'white';
		if (item.color.value === 'андамания') item.color.class = 'purple';
		if (item.color.value === 'гудрон') item.color.class = 'dark';
		if (item.color.value === 'гудрон') item.color.class = 'dark';
		if (item.color.value === 'сосательный петушок') item.color.class = 'sunny';

		return item;
	}

	// выводит состав цветов в кликабельную кнопку
	sostav() {
		const flowers = [...new Set(this.getFlowers().map(p => {
			let flower = p.offer.displayName;
			flower = flower.replace(/\s*—.*$/, '');
			flower = flower.replace(/\sодн|\sкуст/, '');
			flower = flower.replace(/\s-\s.*$/, '');
			flower = flower.replace(/\s\d*.*$/, '');
			flower = flower.replace(/Роза(.*)/, 'Роза');
			flower = flower.trim();
			return flower;
		}))];
		if (!flowers.length) return;

		const flowersString = flowers.sort().join(', ');
		const btn = copyBtn(flowersString, '');
		btn.lastTo(this.td);
		inlineTooltip(btn, flowersString);
	}

	// фильтрует некаталожные товары, возвращает только цветы
	getFlowers() {
		if (!this.productsNoCatalog?.length) return [];
		return this.productsNoCatalog.filter(product =>
			!noFlowers.some(nf => nf.offers.some(offer => offer.id === product.offer.id))
		);
	}

	// добавляет метку о необходимости добавить смазку
	lovix() {
		if (!this.crm.customFields?.lovix) return;
		this.td.toLast(iconsSVG.lovixlube);
	}

	// получает объект заказа из моего склада
	static async getMs(id) {
		const data = { filter: { externalCode: id } };
		const response = await api('Moysklad', 'orders/get').fetch(data);
		return response?.rows[0];
	}
}

const self = ProductsTd;
OrdersTd.registerClass(ProductsTd);