import normalize from '@helpers/normalize';
import { ProductsRows as Products } from '@modules/order/products/rows';
import { Order } from '@pages/order';

class Finances {
	constructor() {
		this.money = {
			flowers: 0,      // закупочная стоимость цветов в заказе
			noFlowers: 0,    // закупочная стоимость нецветов и допников в заказе
			zakup: 0,        // реализационная стоимость цветов и нецветов в заказе
			dostavka: 0,     // стоимость доставки
			total: 0,        // стоимость каталожных товаров в заказе
			paid: 0,         // сколько оплачено
			current: 0       // сколько потрачено на данный момент
		};
	}

	// Рассчитывает расходы на цветы и нецветы
	async rashod() {
		this.money.flowers = 0;
		this.money.noFlowers = 0;

		const products = await Products.getProductsData();
		products.forEach(product => {
			const sum = product.purchasePrice * product.quantity;
			if (product.isFlower) {
				this.money.flowers += sum;
			} else if (!product.isCatalog || product.isDopnik) {
				this.money.noFlowers += sum;
			}
		});

		//console.log(this.money);
		this.updateRashodDisplay();
		this.updateRashodInputs();
	}

	// Обновляет отображение расходов на цветы и нецветы
	updateRashodDisplay() {
		// удаляет старый блок с расходами
		$('#order-list .flowerNoFlower').remove();

		// добавляет новый блок с расходами
		$(`
            <li class="order-table-footer__list-item flowerNoFlower">
                <p class="order-table-footer__text order-table-footer__text_muted order-table-footer__text_full">
                    Стоимость закупа (цветок / нецветок)
                </p>
                <p class="order-table-footer__text order-table-footer__text_price">
                    <span id="flowersRashodValue">${this.money.flowers}</span>&nbsp;<span class="currency-symbol rub">₽</span> / 
                    <span id="noflowersRashodValue">${this.money.noFlowers}</span>&nbsp;<span class="currency-symbol rub">₽</span>
                </p>
            </li>
        `).prependTo('#order-list .order-table-footer__list');
	}

	// Обновляет скрытые поля с расходами
	updateRashodInputs() {
		const $inputFlowers = $(`#${Order.intaro}_customFields_flower_rashod`);
		const $inputNoFlowers = $(`#${Order.intaro}_customFields_noflower_rashod`);

		$inputFlowers.parent().hide();
		$inputNoFlowers.parent().hide();

		if ($inputFlowers.val() == this.money.flowers && $inputNoFlowers.val() == this.money.noFlowers) return;

		$inputFlowers.val(this.money.flowers);
		$inputNoFlowers.val(this.money.noFlowers);
	}

	// Рассчитывает общую сумму заказа
	products() {
		this.setCurrentMoney();
		this.setPayedMoney();
		this.setDostavkaMoney();
		this.setTotalMoney();
		this.updateProductsDisplay();
	}

	// Обновляет отображение калькулятора
	updateProductsDisplay() {
		console.log('updateProductsDisplay');
		const remaining = this.money.total - this.money.current;
		const moneyProducts = this.money.current - this.money.dostavka;

		let output = '';
		output += moneyProducts;
		output += this.money.dostavka ? ` + <small>доставка:</small> ${this.money.dostavka}` : '';
		output += ` <small>из</small> ${this.money.total}`;
		output += ` (${remaining ? `<small>свободно:</small> <b>${remaining}</b> ₽` : '<b>ok</b>'})`;
		output += ` / <small>оплачено:</small> ${this.money.paid} ₽`;

		$('#popupCalculator').html(output);
	}

	// Устанавливает текущую сумму заказа
	setCurrentMoney() {
		this.money.current = normalize.int($('order-total-summ').text());
	}

	// Устанавливает сумму оплаченных платежей
	setPayedMoney() {
		this.money.paid = 0;
		const payments = $(`[id$="amount_text"][id^="${Order.intaro}_payments"]`);

		payments.each((_, payment) => {
			const $payment = $(payment);
			if ($payment.parents('.payment__content-wrapper')
				.children('.input-group')
				.eq(0)
				.find('[id$="status_chosen"] a span')
				.text() != 'Оплачен')
				return;

			this.money.paid += normalize.int($payment.text());
		});
	}

	// Устанавливает стоимость доставки
	setDostavkaMoney() {
		this.money.dostavka = normalize.int($('delivery-cost').val());
	}

	// Устанавливает общую стоимость товаров
	setTotalMoney() {
		this.money.total = 0;

		if (Products.$table().find('.catalog').length) {
			Products.$table().find('.catalog').each((_, product) => {
				this.money.total += normalize.int($(product).find('[id$="properties_tsena_value"]').val());
			});
		} else {
			this.money.total = this.money.paid;
		}
	}
}

const finances = new Finances();
export const rashod = () => { finances.rashod(); }
export const calculate = () => { finances.products(); }