import RootClass from '@helpers/root_class';
import wait from '@helpers/wait';
import dom from '@helpers/dom';

export default class OrderPropertiesPopup extends RootClass {
	constructor(popup) {
		if (dom.isOrphan(popup)) return;
		super();
		this.popup = popup;
		this.addBtn = popup.node('button[class*="properties__button-add"]');
		this.saveBtn = popup.node('.omnica-modal-window__footer button.omnica-button_primary');
	}

	init() {
		return this;
	}

	// добавляем проперти
	async addProperties(props) {
		for (const prop of props) await this.addProperty(prop);
		this.saveBtn.trigger('click');
	}
	async addProperty(prop) {
		await wait.halfsec();
		this.addBtn.trigger('click');
		await wait.halfsec();
		const inputs = this.popup.nodes('[class*="properties__settings"] input');
		inputs[0].val(prop.name).trigger('input');
		inputs[1].val(prop.value).trigger('input');
		console.log('добавлена property:', prop.name, prop.value);
		await wait.halfsec();
	}
}