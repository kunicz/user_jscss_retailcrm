import RootClass from '@helpers/root_class';
import { ARTIKUL_TRANSPORT, ARTIKUL_DOPNIK, ARTIKUL_DONAT, ARTIKUL_PODPISKA } from '@root/config';
import { moysklad, noFlowers, propsColor, colorsMap } from '@src/mappings';
import { space } from '@helpers/text';
import { getMsProduct } from '@src/requests';
import is from '@helpers/is';
import dom from '@helpers/dom';

export default class Product extends RootClass {
	// сущность из this.crm.items заказа
	constructor(item) {
		super();
		this.item = item;
		this.item.isCatalog = this.item.offer?.article && this.item.offer.article != ARTIKUL_TRANSPORT;
		this.item.isDonat = this.item.offer?.article == ARTIKUL_DONAT;
		this.item.isDopnik = this.item.offer?.article == ARTIKUL_DOPNIK;
		this.item.isPodpiska = this.item.offer?.article == ARTIKUL_PODPISKA;
		this.item.isTransport = this.item.offer?.article == ARTIKUL_TRANSPORT;
		this.item.isNoFlower = noFlowers.some(nf => nf.offers.some(offer => offer.id === this.item.offer.id));
		this.item.isFlower = !this.item.isNoFlower && !this.item.isCatalog;
	}

	init() {
		this.color();
		this.item.display = this.displayNode();
		return this.item;
	}

	// находит цветовую пропертю и выделает ее в отдельную сущность color
	// добавляет class для css
	color() {
		if (!is.object(this.item.properties)) return; // если пропертей нет - это массив, а не объект
		Object.entries(this.item.properties).map(([code, prop]) => {
			if (!propsColor.includes(code)) return;
			this.item.properties.color = addClass(prop);
		});

		// добавляем color class в color prop
		function addClass(prop) {
			for (const [regex, className] of colorsMap) {
				if (regex.test(prop.value)) {
					prop.class = className;
					break;
				}
			}
			// ручное добавлеие класса
			// МА ЛЮ ТЯ
			if (prop.value === 'курица-помада') prop.class = 'pink';
			if (prop.value === 'молочный суп') prop.class = 'white';
			if (prop.value === 'андамания') prop.class = 'purple';
			if (prop.value === 'гудрон') prop.class = 'dark';
			if (prop.value === 'жадина-говядина') prop.class = 'red';
			if (prop.value === 'сосательный петушок') prop.class = 'sunny';

			return prop;
		}
	}

	// нода для вставки в таблицу
	// включает в себя цветовой маркер (если есть) и название
	displayNode() {
		const productCont = dom('<div class="product"></div>');
		const color = this.item.properties.color;
		if (color) productCont.toLast(`<div class="color ${color.class}"><span>${color.value}</span></div>`);
		productCont.toLast(this.titleNode());
		return productCont;
	}

	// нода с названием товара
	titleNode() {
		const title = this.item.offer.displayName + ' ' + space.strNbspStr(`(${this.item.quantity} шт.)`);

		// если нет проперти moysklad-id, то просто возвращаем span ноду
		// почему может не быть проперти:
		// - заказ новый, триггер не запускался ни разу
		// - триггер запускался, но мойсклад не создал запись (например, отключили платный тариф)
		const span = dom('<span class="title"/>').html(title);
		if (!this.item.properties['moysklad-id']) return span;

		// если проперти есть
		const a = dom('<a class="moysklad" href="" target="_blank">').html(title);
		// вешаем слушатель на ссылку
		// если записи в моем складе для товара нет, заменяем ссылку на span
		// если есть, устанавливаем корректный href
		let loaded = false;
		a.listen('mouseenter', async () => {
			if (loaded) return;
			loaded = true;
			const ms = await getMsProduct(this.item.properties['moysklad-id'].value);
			ms?.id ? a.attr('href', `${moysklad.orderUrl}${ms.id}`) : a.replaceBy(span);
		});
		return a;
	}
}