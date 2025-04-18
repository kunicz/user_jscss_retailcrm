import '@css/customer.css';

export default class Customer {
	static name = 'customer';

	init() {
		this.preferedName();
	}

	// добавляет кнопку для использования ФИО в качестве предпочитаемого имени
	preferedName() {
		$(`<a class="getFromFio">использовать ФИО</a>`)
			.on('click', e => {
				const fio = [
					$('#crm_customer_edit_lastName').val(),
					$('#crm_customer_edit_firstName').val(),
					$('#crm_customer_edit_patronymic').val()
				];
				$('#crm_customer_edit_customFields_prefered_name').val(fio.join(' ').trim());
			})
			.insertAfter($('#crm_customer_edit_customFields_prefered_name'));
	}
}
