import RootClass from '@helpers/root_class';
import Popup from '@modules/popup/popup';
import { user } from '@src';
import { bankNames } from '@src/mappings';
import retailcrm from '@helpers/retailcrm_direct';
import dom from '@helpers/dom';

export default class CouriersPopup extends RootClass {
	constructor() {
		super();
		this.el = null;
		this.id = 'couriers';
		this.title = 'Курьеры';
		this.callback = this.init.bind(this);
	}

	async init() {
		this.el = dom('#custom_popup');
		if (this.el.data('page') !== this.id) {
			const cities = await this.getCities();
			const couriers = await this.getCouriers(cities);

			// напоняем popup контентом
			this.el.data('page', this.id);
			this.el.node(`#omnica-modal-window-title`).html(this.title);
			this.el.node('#custom_popup__content').empty();
			this.el.node('#custom_popup__search_form')?.destroy();
			this.renderSearchForm();
			this.renderList();
			this.renderEditbox(cities);
		}
		this.el.show();
	}

	// получает всех курьеров
	async getCouriers(cities) {
		const couriers = await retailcrm.get.couriers.all();
		return couriers.filter(courier => !courier.city || cities.includes(courier.city));
	}

	// получает все города
	async getCities() {
		return user?.groups
			.filter(role => role.code.startsWith('manager-'))
			.map(role => role.code.split('-')[1]);
	}

	// рендерит форму поиска
	renderSearchForm() {
		dom(Popup.searchForm('имя курьера')).lastTo(this.el.node(`#omnica-modal-window-title`));
	}

	// рендерит список курьеров
	renderList() {
		dom('<div id="couriers_list" />').lastTo(this.el.node('#custom_popup__content'));
	}

	// рендерит форму для добавления курьера
	renderEditbox(cities) {
		const city = cities.length > 1 ? 'мск' : cities[0];
		const banks = bankNames.map(bank => `<option value="${bank}">${bank}</option>`).join('');
		const form = dom(`
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
		dom(`<div id="couriers_editbox" />`).toLast(form).lastTo(this.el.node('#custom_popup__content'));
	}
}