import RootClass from '@helpers/root_class';
import normalize from '@helpers/normalize';
import wait from '@helpers/wait';
import dom from '@helpers/dom';

export default class Finances extends RootClass {
	constructor() {
		super();
		this.observer = this.setObserver();
		this.money = {}
		this.trs = dom.all('tr[id^="order-product-section"]');
		this.summaryBlock = dom('#order-list [class*="footer__section_summary"]');
		this.amountBlock = this.summaryBlock.node('[class^="total"]');
	}

	init() {
		this.watch();
		this.moneyDrop();
		this.fnfDom();
		this.fnf();
		dom('#main').data('finances', this);
		return this;
	}

	// обнуляет все финансовые данные
	moneyDrop() {
		this.money.flowers = 0; // закупочная стоимость цветов в заказе
		this.money.noflowers = 0; // закупочная стоимость нецветов и допников в заказе
		this.money.dostavka = 0; // стоимость доставки
		this.money.total = 0; // стоимость каталожных товаров в заказе
		this.money.paid = 0; // сколько оплачено
		this.money.current = 0; // сколько потрачено на данный момент
	}

	// следит за изменениями в финансовой информации
	// retailcrm все изменения реактивно аккумулирует в подвале таблицы,
	// поэтому достаточно просто подписаться на его изменения
	watch() {
		this.observer
			.setTarget(this.amountBlock)
			.onMutation(async () => {
				if (dom.all('tr[id^="order-product-section"]').length === 0) return;
				this.fnf();
				this.calculator();
			})
			.start();
	}

	// FLOWERS & NOFLOWERS
	// рассчитывает расходы на цветы и нецветы
	async fnf() {
		await wait.check(() => !this.trs.filter(tr => !tr.is('.loaded')).length); // убеждаемся, что все строки загрузились
		this.fnfCalculate(); // считаем расходы на цветы и нецветы
		this.fnfDisplay(); // отображаем расходы на цветы и нецветы;
	}
	fnfDom() {
		this.summaryBlock.child('[class*="summary"]')
			.toFirst('<div aria-labelledby="rashodNoFlowers" class="value_dBWqN"></div>')
			.toFirst('<div id="rashodNoFlowers" class="name_BegIS">Расход на нецветы</div>')
			.toFirst('<div aria-labelledby="rashodFlowers" class="value_dBWqN"></div>')
			.toFirst('<div id="rashodFlowers" class="name_BegIS">Расход на цветы</div>');
	}
	fnfCalculate() {
		this.money.flowers = 0;
		this.money.noflowers = 0;
		this.trs.forEach(tr => {
			const sum = tr.getPurchasePrice() * tr.getQuantity();
			if (tr.isFlower()) {
				this.money.flowers += sum;
			} else {
				this.money.noflowers += sum;
			}
		});
	}
	fnfDisplay() {
		dom('#rashodFlowers')?.next().txt(parseFloat(this.money.flowers.toFixed(2)) + ' ₽');
		dom('#rashodNoFlowers')?.next().txt(parseFloat(this.money.noflowers.toFixed(2)) + ' ₽');
	}


	// CALCULATOR
	// Рассчитывает общую сумму заказа
	calculator() {
		// нода калькулятора
		// запрашиваем как массив, так как при быстрых переходах между страницами
		// есть вероятность, что в доме будет несколько попапов с несколькими калькуляторами
		// поэтому берем самый свежий (последний)
		const calc = dom.all('#popupCalculator').at(-1);
		if (!calc) return;

		this.moneyDrop();
		this.setCurrentMoney();
		this.setPayedMoney();
		this.setDostavkaMoney();
		this.setTotalMoney();
		this.updateCalculatorDisplay(calc);
	}

	// Обновляет отображение калькулятора
	updateCalculatorDisplay(calc) {
		const remaining = this.money.total - this.money.current;
		const moneyProducts = this.money.current - this.money.dostavka;

		let output = '';
		output += moneyProducts;
		output += this.money.dostavka ? ` + <small>доставка:</small> ${this.money.dostavka}` : '';
		output += ` <small>из</small> ${this.money.total}`;
		output += ` (${remaining ? `<small>свободно:</small> <b>${remaining}</b> ₽` : '<b>ok</b>'})`;
		output += ` / <small>оплачено:</small> ${this.money.paid} ₽`;

		calc.html(output);
	}

	// Устанавливает текущую сумму заказа
	setCurrentMoney() {
		this.money.current = normalize.number(this.amountBlock.txt());
	}

	// Устанавливает сумму оплаченных платежей
	setPayedMoney() {
		this.money.paid = 0;
		const payments = dom.all('#payments > div').filter(p => p.node('select[id$="status"]').val() == 9); // 9 - оплачен
		payments.forEach(p => this.money.paid += normalize.number(p.node('[id$="amount_text"]').txt()));
	}

	// Устанавливает стоимость доставки
	setDostavkaMoney() {
		this.money.dostavka = normalize.number(dom('#delivery-cost').val());
	}

	// Устанавливает общую стоимость товаров
	setTotalMoney() {
		this.money.total = 0;
		const trs = this.trs.filter(tr => tr.isCatalog());
		if (trs.length) {
			trs.forEach(tr => this.money.total += normalize.number(tr.getProperties()?.find(p => p.name === 'цена')?.value));
		} else {
			this.money.total = this.money.paid;
		}
	}
}