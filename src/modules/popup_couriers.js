import * as popup from '../popup.js';
import { user } from '../index.js';
import { bankNames } from '../mappings.js';
import retailcrm from '@helpers/retailcrm';

let couriers = [];
const couriersMeta = {
	id: 'couriers',
	title: 'Курьеры',
	callback: () => couriersLogic()
}

export default couriersMeta;

async function couriersLogic() {
	popup.init(couriersMeta);
	const $cont = $('#custom_popup__content');
	const cities = await getCities();
	if (!couriers.length) couriers = await getCouriers(cities);
	searchForm();
	list();
	editbox(cities);
}

async function getCouriers(cities) {
	const couriers = await retailcrm.get.couriers.all();
	console.log(couriers);
	return couriers.filter(courier => !courier.city || cities.includes(courier.city));
}

function getCities() {
	return user.groups
		.filter(role => role.code.startsWith('manager-')) // Оставляем только manager-*
		.map(role => role.code.split('-')[1]); // Берём только часть после дефиса
}

function searchForm() {
	if ($('#couriers_popup_search_form').length) return;
	const $searchForm = $(popup.searchForm('couriers', 'имя курьера'));
	$searchForm.appendTo($('#custom_popup #omnica-modal-window-title'));
}

function list() {
	const block = $(`<div id="couriers_list"></div>`);
	block.appendTo($('#custom_popup__content'));
}

function editbox(cities) {
	const block = $(`<div id="couriers_editbox"></div>`);
	block.append(form());
	block.appendTo($('#custom_popup__content'));

	function form() {
		const city = cities.length > 1 ? 'мск' : cities[0];
		const banks = bankNames.map(bank => `<option value="${bank}">${bank}</option>`).join('');
		return $(`
		<form id="couriers_editbox_form" data-mode="create">
			<div class="input-group cleared">
				<label class="label-common" for="couriers_editbox_form_name">Имя</label>
				<input type="text" id="couriers_editbox_form_name" class="input-field" />
			</div>
			<div class="input-group cleared">
				<label class="label-common" for="couriers_editbox_form_phone">Телефон</label>
				<input type="text" id="couriers_editbox_form_phone" class="input-field" />
			</div>
			<div class="input-group cleared">
				<label class="label-common" for="couriers_editbox_form_bank">Банк</label>
				<select id="couriers_editbox_form_bank" class="input-field">${banks}</select>
			</div>
			<div class="input-group cleared">
				<label class="label-common" for="couriers_editbox_form_description">Комментарии</label>
				<textarea id="couriers_editbox_form_description" class="input-field"></textarea>
			</div>
			<input type="hidden" id="couriers_editbox_form_city" value="${city}" />
			<button type="submit" id="couriers_editbox_form_btn" class="btn_success small btn-save btn">
				<div class="btn-content btn-content_icon btn-content_done">Сохранить</div>
			</button>
		</form>	
		`);
	}
}