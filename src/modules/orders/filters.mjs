import RootClass from '@helpers/root_class';
import dates from '@helpers/dates';
import dom from '@helpers/dom';
import '@css/orders_filters.css';

export default class OrdersFilters extends RootClass {
	init() {
		this.dostavkaDate();
		this.orderDate();
		this.spisanie();
		this.batchHide();
		this.otkudaUznal();
	}

	//фильтр: дата доставки
	//фильтр: дата доставки
	dostavkaDate() {
		const group = this.getFilterGroup('дата доставки');
		if (!group) return;

		//формирует заголовок для ссылки фильтра
		const getTitle = (date1, date2) => {
			if (date1 === date2) {
				if (date1.d === dates.today.d) return 'сегодня';
				if (date1.d - dates.today.d === 1) return 'завтра';
				return `${date1.dd}.${date1.mm}`;
			} else {
				return `${date1.dd}-${date2.dd}`;
			}
		}

		//формирует ссылку для фильтра по дате
		const makeLink = (date1, date2 = date1) => {
			const title = getTitle(date1, date2);
			return dom(`<a class="filterDate" href="${this.buildUrl({ from: date1.str, to: date2.str })}">${title}</a>`);
		}

		const cont = dom('<div class="additonalFilters"></div>');

		cont
			.toLast(makeLink(dates.yesterday))
			.toLast(makeLink(dates.today))
			.toLast(makeLink(dates.today, dates.tomorrow))
			.toLast(makeLink(dates.tomorrow))
			.toLast(makeLink(dates.tomtomorrow))
			.lastTo(group);
	}

	//фильтр: дата заказа
	orderDate() {
		const group = this.getFilterGroup('Дата оформления заказа');
		if (!group) return;

		group.toLast(`<div class="additonalFilters">
		<a class="filterDate" href="${this.buildUrl({ from: dates.today.str })}">${dates.today.title}</a>
		<a class="filterDate" href="${this.buildUrl({ from: dates.yesterday.str })}">${dates.yesterday.title}</a>
		</div>`);
	}

	//фильтр: списание
	spisanie() {
		const group = this.getFilterGroup('покупатель');
		if (!group) return;

		//формирует дату для фильтра списания с учетом смещения месяцев
		const getMonthDate = (offset) => {
			const date = new Date();
			date.setMonth(date.getMonth() + offset, 2); // Ставим 2-е число
			return dates.create(date);
		}

		const cont = dom('<div class="additonalFilters"></div>');
		const thisMonth = getMonthDate(0);
		const prevMonth = getMonthDate(-1);
		const nextMonth = getMonthDate(1);
		const data = [
			{
				title: `списание (${thisMonth.month})`,
				from: thisMonth.str,
				to: nextMonth.str
			},
			{
				title: `списание (${prevMonth.month})`,
				from: prevMonth.str,
				to: thisMonth.str
			}
		];

		const links = data.map(date =>
			dom(`<a class="filterDate" href="${this.buildUrl({
				from: date.from,
				to: date.to,
				customer: 'Списание',
				sort: 'created_at',
				direction: 'desc'
			})}">${date.title}</a>`
			));
		links.forEach(link => cont.toLast(link));
		group.toLast(cont);
	}

	//показывать/скрывать сервисные заказы
	batchHide() {
		this.createToggleButton('Технические заказы', () => dom('tr.batchHide').forEach(d => d.toggle()));
	}

	//показывать/скрывать откуда узнал
	otkudaUznal() {
		this.createToggleButton('Откуда узнал', () => dom('[col*="узнал о нас"]').forEach(d => d.toggle()));
	}

	//создает кнопку-переключатель в футере фильтров
	createToggleButton(text, callback) {
		return dom(`<div class="additonalFilters inFooter"><a>${text}</a></div>`)
			.nextTo('.m-filter .parameters')
			.listen('click', e => {
				e.preventDefault();
				callback();
			});
	}

	//находит группу фильтров по названию
	getFilterGroup(name) {
		const groups = dom('.default-form-filter .filter-group');
		const filterGroups = groups.filter(g => dom(g).node('.control-label span')?.txt().toLowerCase() === name.toLowerCase());
		return filterGroups?.[0];
	}

	//формирует URL с параметрами фильтрации
	buildUrl(options) {
		const {
			from,
			to,
			customer = '',
			sort = 'delivery_time_string',
			direction = 'asc'
		} = options;

		const params = new URLSearchParams();

		if (from && to) {
			params.set('filter[deliveryDateFrom][abs]', from);
			params.set('filter[deliveryDateTo][abs]', to);
		} else if (from) {
			params.set('filter[deliveryDateFrom][abs]', from);
			params.set('filter[deliveryDateTo][abs]', from);
		} else if (to) {
			params.set('filter[deliveryDateFrom][abs]', to);
			params.set('filter[deliveryDateTo][abs]', to);
		}

		if (customer) {
			params.set('filter[customer]', customer);
		}

		params.set('filter[sort]', sort);
		params.set('filter[direction]', direction);

		return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
	}
}