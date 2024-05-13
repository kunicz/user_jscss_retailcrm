import { isPage } from '../helpers';
import '../css/customer.css';

export function customer() {
	if (!isPage('customers\/\\d+')) return;

	console.log('user_jscss : customer_editable');

	preferedName();
}

function preferedName() {
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