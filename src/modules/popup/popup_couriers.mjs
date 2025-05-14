import RootClass from '@helpers/root_class';
import Popup from '@src/popup';
import App from '@src';
import { bankNames } from '@src/mappings';
import retailcrm from '@helpers/retailcrm_direct';

export default class CouriersPopup extends RootClass {
	constructor() {
		super();
		this.couriers = [];
		this.init = this.init.bind(this);
		this.meta = {
			id: 'couriers',
			title: 'Курьеры',
			callback: this.init
		};
		this.p = 'custom_popup';
		this.$cont = $(`#${this.p}__content`);
		this.popup = new Popup(this.meta);
	}

	async init() {
		this.popup.init();
		const cities = await this.getCities();
		if (!this.couriers.length) this.couriers = await this.getCouriers(cities);
		this.renderSearchForm();
		this.renderList();
		this.renderEditbox(cities);
	}

	// получает всех курьеров
	async getCouriers(cities) {
		const couriers = await retailcrm.get.couriers.all();
		return couriers.filter(courier => !courier.city || cities.includes(courier.city));
	}

	// получает все города
	async getCities() {
		return App.user?.groups
			.filter(role => role.code.startsWith('manager-'))
			.map(role => role.code.split('-')[1]);
	}

	// рендерит форму поиска
	renderSearchForm() {
		if ($('#couriers_popup_search_form').length) return;
		const $searchForm = $(Popup.searchForm('couriers', 'имя курьера'));
		$searchForm.appendTo($(`#${this.p} #omnica-modal-window-title`));
	}

	// рендерит список курьеров
	renderList() {
		const block = $(`<div id="couriers_list"></div>`);
		block.appendTo($(`#${this.p}__content`));
	}

	// рендерит форму для добавления курьера
	renderEditbox(cities) {
		const block = $(`<div id="couriers_editbox"></div>`);
		block.append(this.createForm(cities));
		block.appendTo($(`#${this.p}__content`));
	}

	// создает форму для добавления курьера
	createForm(cities) {
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