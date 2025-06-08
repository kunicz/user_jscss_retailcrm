import RootClass from '@helpers/root_class';
import dom from '@helpers/dom';
import '@css/customer.css';

export default class Customer extends RootClass {
	static name = 'customer';

	init() {
		this.preferedName();
	}

	// добавляет кнопку для использования ФИО в качестве предпочитаемого имени
	preferedName() {
		dom('<a class="getFromFio">использовать ФИО</a>')
			.nextTo('#crm_customer_edit_customFields_prefered_name')
			.listen('click', e => {
				const fio = [
					dom('#crm_customer_edit_lastName').val(),
					dom('#crm_customer_edit_firstName').val(),
					dom('#crm_customer_edit_patronymic').val()
				].filter(Boolean).join(' ');
				dom('#crm_customer_edit_customFields_prefered_name').val(fio);
			});
	}
}
