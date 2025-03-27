import adres from '@modules/order/adres';
import normalize from '@helpers/normalize';

export default (order) => new Dostavka(order).init();

class Dostavka {
	constructor(order) {
		this.order = order;
	}

	init() {
		this.address();
		this.price();
		this.time();
	}

	time() {
		//разблокируем поля для редактирования времени
		$(`#${this.order.intaro}_deliveryTime_from, #${this.order.intaro}_deliveryTime_to`).removeAttr('readonly');
	}

	address() {
		//адрес из тильды
		$(`#${this.order.intaro}_customFields_adres_poluchatelya`).parent().insertAfter($('#delivery-address-form'));

		//справка про автоматический парсинг адреса
		let str = `Чтобы в таблице адрес стал кликабельным, соблюдай шаблон:<br>${adres.parts.map(item => `<b>${item[0]}</b> (${item[1]})`).join(", ")}<br>Например: ул. Тверская, ш. Энтузиастов`;
		$(`#${this.order.intaro}_deliveryAddress_text`)
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

	price() {
		//изменяем заголовок: себестоимость -> стоимость для курьера
		$(`label[for="${this.order.intaro}_deliveryNetCost"]`).text('Стоимость для курьера');

		//если стоимость доставки не указана, то эмулируем клик
		if (!normalize.int($('#delivery-cost').val())) $('#order-delivery-cost__link-cost-manual').trigger('click');
		if (!normalize.int($('#delivery-net-cost').val())) $('#order-delivery-net-cost__link-cost-manual').trigger('click');
	}
}

