import { bankNames } from '@src/mappings.mjs';

let descr = {};
let descrBlock = '';

export default () => {
	descr.bank = '';
	descr.comments = '';
	descrBlock = $('form[name="intaro_crmbundle_couriertype"] .control-group:last');
	descrBlock.hide();

	validateDescr();
	bank();
	comments();
}

function bank() {
	const select = $('<select id="courierBank"></select>');
	bankNames.forEach(bank => select.append(`<option value="${bank}">${bank}</option>`));
	if (descr.bank != undefined) select.val(descr.bank);
	select.on('change', () => {
		descr.bank = select.val();
		writeJson();
	});
	$(`
	<div class="control-group">
		<div class="control-label">
			<label for="courierBank">
				<span>Банк</span>
			</label>
		</div>
		<div class="controls"></div>
	</div>`).insertBefore(descrBlock.prev()).find('.controls').append(select);
}

function comments() {
	const comments = $('<textarea></textarea>');
	comments.val(descr.comments);
	comments.on('change', () => {
		descr.comments = comments.val();
		writeJson();
	});
	$(`
	<div class="control-group">
		<div class="control-label">
			<label for="courierBank">
				<span>Комментарии</span>
			</label>
		</div>
		<div class="controls"></div>
	</div>`).insertBefore(descrBlock).find('.controls').append(comments);
}

function validateDescr() {
	const str = descrBlock.find('textarea').val();
	try {
		descr = JSON.parse(str);
		return;
	} catch {
		if (str.includes('банк')) {
			descr.bank = str.replace('банк: ', ''); //старые комментарии к курьерам уже все перебраны, но пусть будет
		} else {
			descr.comments = str;
		}
		return;
	}
}

function writeJson() {
	descrBlock.find('textarea').val(JSON.stringify(descr));
}