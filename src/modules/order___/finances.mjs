import ProductsRows from '@modules/order/products/rows';
import normalize from '@helpers/normalize';
import wait from '@helpers/wait';
import Observer from '@helpers/observers/Builder.mjs';
import Order from '@pages/order';

export default class Finances {
	static observer = new Observer();
	static money = {};

	static init() {
		self.moneyDrop();
		self.listen();
		self.rashod();
	}

	// обнуляет все финансовые данные
	static moneyDrop() {
		self.money.flowers = 0; // закупочная стоимость цветов в заказе
		self.money.noflowers = 0; // закупочная стоимость нецветов и допников в заказе
		self.money.zakup = 0; // реализационная стоимость цветов и нецветов в заказе
		self.money.dostavka = 0; // стоимость доставки
		self.money.total = 0; // стоимость каталожных товаров в заказе
		self.money.paid = 0; // сколько оплачено
		self.money.current = 0; // сколько потрачено на данный момент
	}

	// следит за изменениями в финансовой информации
	// retailcrm все изменения реактивно аккумулирует в подвале таблицы,
	// поэтому достаточно просто подписаться на его изменения
	static listen() {
		self.observer
			.setTarget('#order-list div[class*="footer__section_summary"] div[class^="total"]')
			.onMutation(async () => {
				const products = await ProductsRows.products();
				products.forEach(product => product.update());
				self.rashod();
				self.calculator();
			})
			.once()
			.start();
	}

	// рассчитывает расходы на цветы и нецветы
	static async rashod() {
		self.money.flowers = 0;
		self.money.noflowers = 0;

		const products = await ProductsRows.products();
		products.forEach(product => {
			const sum = product.purchasePrice * product.quantity;
			if (product.isFlower) {
				self.money.flowers += sum;
			} else if (!product.isCatalog || product.isDopnik) {
				self.money.noflowers += sum;
			}
		});

		self.updateRashodDisplay();
		self.updateRashodInputs();
	}

	// Обновляет отображение расходов на цветы и нецветы
	static updateRashodDisplay() {
		self.observer.stop();

		// удаляет старый блок с расходами
		$('#order-list .flowerNoFlower').remove();

		// добавляет новый блок с расходами
		$(`
            <li class="order-table-footer__list-item flowerNoFlower">
			<p class="order-table-footer__text order-table-footer__text_muted order-table-footer__text_full">
			Стоимость закупа (цветок / нецветок)
			</p>
                <p class="order-table-footer__text order-table-footer__text_price">
				<span id="flowersRashodValue">${self.money.flowers}</span>&nbsp;<span class="currency-symbol rub">₽</span> / 
				<span id="noflowersRashodValue">${self.money.noflowers}</span>&nbsp;<span class="currency-symbol rub">₽</span>
                </p>
				</li>
				`).prependTo('#order-list .order-table-footer__list');

		self.observer.start();
	}

	// Обновляет скрытые поля с расходами
	static updateRashodInputs() {
		const data = ['', 'no'].map(prefix => {
			const $input = $(`#${Order.intaro}_customFields_${prefix}flower_rashod`);
			$input.parent().hide();
			return {
				$input,
				prefix,
				old: normalize.int($input.val()),
				new: self.money[`${prefix}flowers`]
			};
		});

		if (data.some(d => !d.$input.length)) return;

		data.forEach(d => {
			if (isNaN(d.new) || d.old === d.new) return;
			d.$input.val(d.new);
			console.log(`Расход на ${d.prefix}flowers установлен`, d.old, '→', d.new);
		});
	}

	// Рассчитывает общую сумму заказа
	static async calculator() {
		self.setCurrentMoney();
		self.setPayedMoney();
		self.setDostavkaMoney();
		await self.setTotalMoney();
		self.updateCalculatorDisplay();
	}

	// Обновляет отображение калькулятора
	static updateCalculatorDisplay() {
		const $popupCalculator = $('#popupCalculator'); // в попапе выбора товаров
		if (!$popupCalculator.length) return;

		const remaining = self.money.total - self.money.current;
		const moneyProducts = self.money.current - self.money.dostavka;

		let output = '';
		output += moneyProducts;
		output += self.money.dostavka ? ` + <small>доставка:</small> ${self.money.dostavka}` : '';
		output += ` <small>из</small> ${self.money.total}`;
		output += ` (${remaining ? `<small>свободно:</small> <b>${remaining}</b> ₽` : '<b>ok</b>'})`;
		output += ` / <small>оплачено:</small> ${self.money.paid} ₽`;

		$popupCalculator.html(output);
	}

	// Устанавливает текущую сумму заказа
	static setCurrentMoney() {
		self.money.current = normalize.int($('#order-total-summ').text());
	}

	// Устанавливает сумму оплаченных платежей
	static setPayedMoney() {
		self.money.paid = 0;
		const payments = $(`[id$="amount_text"][id^="${Order.intaro}_payments"]`);

		payments.each((_, payment) => {
			const $payment = $(payment);
			if ($payment.parents('.payment__content-wrapper')
				.children('.input-group')
				.eq(0)
				.find('[id$="status_chosen"] a span')
				.text() != 'Оплачен')
				return;

			self.money.paid += normalize.int($payment.text());
		});
	}

	// Устанавливает стоимость доставки
	static setDostavkaMoney() {
		self.money.dostavka = normalize.int($('#delivery-cost').val());
	}

	// Устанавливает общую стоимость товаров
	static async setTotalMoney() {
		self.money.total = 0;

		const products = await ProductsRows.products();
		const catalogProducts = products.filter(product => product.isCatalog);
		if (catalogProducts.length) {
			catalogProducts.forEach(product => {
				self.money.total += normalize.int(product.properties.items.find(item => item.name === 'цена')?.value);
			});
		} else {
			self.money.total = self.money.paid;
		}
	}
}

const self = Finances;