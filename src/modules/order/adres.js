import { copy } from '@helpers/clipboard';

export default {
	parts: [
		['ул', 'улица'],
		['наб', 'набережная'],
		['бул', 'бульвар'],
		['ш', 'шоссе'],
		['пр-кт', 'проспект'],
		['пр-д', 'проезд'],
		['пер', 'переулок'],
		['пл', 'площадь'],
		['алл', 'аллея']
	],

	ctrlc: (type) => {
		const id = '#intaro_crmbundle_ordertype_deliveryAddress_';
		const copyValues = ['', ''];
		const a = {
			city: ``,
			street: ``,
			building: `д.`,
			housing: `корп.`,
			house: `стр.`,
			flat: `кв./офис`,
			block: `подъезд`,
			floor: `этаж`
		}
		Object.keys(a).map(key => {
			if ($(id + key).val()) copyValues[1] += `${a[key]} ${$(id + key).val()}, `;
			if ($(id + key).val() && ['city', 'street', 'building', 'housing', 'house'].includes(key)) copyValues[0] += `${a[key]} ${$(id + key).val()}, `;
		});
		copyValues.forEach((e, i) => copyValues[i] = e.slice(0, -2));
		copy(copyValues[type]);
	},

	clear: () => {
		$('#delivery-address-form textarea, #delivery-address-form input').val('');
	}
}