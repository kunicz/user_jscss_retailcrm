import RootClass from '@helpers/root_class';
import { bankNames } from '@src/mappings';
import dom from '@helpers/dom';

export default class Courier extends RootClass {
	static name = 'courier';

	constructor() {
		super();
		this.descrBlock = dom('form[name="intaro_crmbundle_couriertype"] .control-group').at(-1);
		this.descrTextarea = this.descrBlock.node('textarea');
		this.descr = this.parseDescr();
	}

	init() {
		this.descrBlock.hide();
		this.bank();
		this.comments();
	}

	// парсит данные курьера из поля textarea
	parseDescr() {
		return this.descrTextarea.val() != '' ? JSON.parse(this.descrTextarea.val()) : { bank: '', comments: '' };
	}

	// добавляет поле для выбора банка
	bank() {
		const select = dom('<select id="courierBank"></select>');
		bankNames.forEach(bank => select.toLast(`<option value="${bank}">${bank}</option>`));
		if (this.descr.bank != undefined) select.val(this.descr.bank);
		select.listen('change', () => {
			this.descr.bank = select.val();
			this.writeJson();
		});
		dom(`
		<div class="control-group">
			<div class="control-label">
				<label for="courierBank">
					<span>Банк</span>
				</label>
			</div>
			<div class="controls"></div>
		</div>`).prevTo(this.descrBlock.prev()).node('.controls').toLast(select);
	}

	// добавляет поле для комментариев
	comments() {
		const comments = dom('<textarea></textarea>');
		comments.val(this.descr.comments);
		comments.listen('change', () => {
			this.descr.comments = comments.val();
			this.writeJson();
		});
		dom(`
		<div class="control-group">
			<div class="control-label">
				<label for="courierBank">
					<span>Комментарии</span>
				</label>
			</div>
			<div class="controls"></div>
		</div>`).prevTo(this.descrBlock).node('.controls').toLast(comments);
	}

	// записывает данные курьера в формате JSON в поле textarea
	writeJson() {
		this.descrTextarea.val(JSON.stringify(this.descr));
	}
}