import adres from './order_adres.js';

export default () => {
	address();
	price();
	time();
	courier();
	sklad();
}

function time() {
	$('#intaro_crmbundle_ordertype_deliveryTime_from,#intaro_crmbundle_ordertype_deliveryTime_to').removeAttr('readonly');
}

function address() {
	//адрес из тильды
	$('#custom-field-adres_poluchatelya').parent().insertAfter($('#delivery-address-form'));

	//справка про автоматический парсинг адреса
	let str = `Чтобы в таблице адрес стал кликабельным, соблюдай шаблон:<br>${adres.parts.map(item => `<b>${item[0]}</b> (${item[1]})`).join(", ")}<br>Например: ул. Тверская, ш. Энтузиастов`;
	$(`#intaro_crmbundle_ordertype_deliveryAddress_text`)
		.wrap(`<div class="adresTooltip tooltip"></div>`)
		.parent().append(`<div class="tooltip__content"><div class="tooltip__inner">${str}</div></div>`);

	//скопировать адрес в буфер
	$(`<div id="ctrlcAdres" class="input-group input-group_small-wrap cleared"></div>`)
		.insertAfter($('#delivery-address-form'))
		.append(`<a class="complete-link input-small-link" type="1">❐ адрес целиком</a>`)
		.append(`<a class="complete-link input-small-link" type="0">❐ короткий адрес</a>`);
	$('#ctrlcAdres a').on('click', e => adres.ctrlc($(e.target).attr('type')));

	//очистить адрес
	$(`<a class="complete-link input-small-link">очистить адрес</a>`)
		.insertBefore($('#delivery-address-form'))
		.on('click', () => adres.clear())
		.wrap(`<div id="clearAdres" class="input-group input-group_small-wrap"></div>`);
}

function price() {
	$('label[for="intaro_crmbundle_ordertype_deliveryNetCost"]').text('Стоимость для курьера');
}

function courier() {
	//автокурьер определяется в товарах (так как если добавляется новый товар, надо понять, он только авто или нет)
}

function sklad() {

}