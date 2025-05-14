import RootClass from '@helpers/root_class';
import { bankNames } from '@src/mappings';

export default class Courier extends RootClass {
	static name = 'courier';

	constructor() {
		super();
		this.descr = {
			bank: '',
			comments: ''
		};
		this.descrBlock = $('form[name="intaro_crmbundle_couriertype"] .control-group:last');
	}

	init() {
		this.descrBlock.hide();
		this.validateDescr();
		this.bank();
		this.comments();
	}

	// добавляет поле для выбора банка
	bank() {
		const select = $('<select id="courierBank"></select>');
		bankNames.forEach(bank => select.append(`<option value="${bank}">${bank}</option>`));
		if (this.descr.bank != undefined) select.val(this.descr.bank);
		select.on('change', () => {
			this.descr.bank = select.val();
			this.writeJson();
		});
		$(`
		<div class="control-group">
			<div class="control-label">
				<label for="courierBank">
					<span>Банк</span>
				</label>
			</div>
			<div class="controls"></div>
		</div>`).insertBefore(this.descrBlock.prev()).find('.controls').append(select);
	}

	// добавляет поле для комментариев
	comments() {
		const $comments = $('<textarea></textarea>');
		$comments.val(this.descr.comments);
		$comments.on('change', () => {
			this.descr.comments = $comments.val();
			this.writeJson();
		});
		$(`
		<div class="control-group">
			<div class="control-label">
				<label for="courierBank">
					<span>Комментарии</span>
				</label>
			</div>
			<div class="controls"></div>
		</div>`).insertBefore(this.descrBlock).find('.controls').append(comments);
	}

	// проверяет, есть ли данные курьера в поле textarea
	// если есть, то парсит их и записывает в this.descr
	// если нет, то проверяет, есть ли в поле комментарии с банком
	// если есть, то записывает банк в this.descr.bank
	// если нет, то записывает комментарии в this.descr.comments
	validateDescr() {
		const str = this.descrBlock.find('textarea').val();
		try {
			this.descr = JSON.parse(str);
			return;
		} catch {
			if (str.includes('банк')) {
				this.descr.bank = str.replace('банк: ', ''); //старые комментарии к курьерам уже все перебраны, но пусть будет
			} else {
				this.descr.comments = str;
			}
			return;
		}
	}

	// записывает данные курьера в формате JSON в поле textarea
	writeJson() {
		this.descrBlock.find('textarea').val(JSON.stringify(this.descr));
	}
}