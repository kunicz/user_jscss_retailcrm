import retailcrm from '@helpers/retailcrm_direct';
import { Order } from '@pages/order';

export default () => new Discount().init();

class Discount {
	init() {
		this.checkDiscount();
	}

	//проверяем и применяем скидку для STAY TRUE Flowers
	async checkDiscount() {
		if (Order.getShop().id !== 2) return;
		if (Order.getStatus() === 'Выполнен') return;
		if ($(`#${Order.intaro}_customFields_discount_trigger_ignore`).is(':checked')) return;

		// Получаем ID покупателя
		const customerId = $('[data-order-customer-id]').attr('data-order-customer-id');
		if (!customerId) return;

		// Запрашиваем данные клиента
		const customer = await retailcrm.get.customer.byId(customerId);
		if (!customer || customer.ordersCount < 2 || !customer.totalSumm) return;

		// Определяем размер скидки
		const discount = customer.totalSumm < 25000 ? 5 : customer.totalSumm < 50000 ? 7 : 10;

		$(`#${this.order.intaro}_discountManualPercent`).val(discount).change();
	}



}
