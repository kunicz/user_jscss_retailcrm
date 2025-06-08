import normalize from '@helpers/normalize';
import { intaro } from '@modules/order/sections';
import { adresParts } from '@src/mappings.mjs';
import copyBtn from '@helpers/clipboard';
import dom from '@helpers/dom';

export default class Dostavka {
	async init() {
		this.adres();
		this.price();
		this.time();
		this.courier();
	}

	time() {
		//разблокируем поля для редактирования времени
		dom(`#${intaro}_deliveryTime_from, #${intaro}_deliveryTime_to`).forEach(el => el.removeAttr('readonly'));
	}

	adres() {
		//адрес из тильды
		dom(`#custom-field-adres_poluchatelya`)?.parent().nextTo('#delivery-address-form');

		//справка про автоматический парсинг адреса
		let str = `Чтобы в таблице адрес стал кликабельным, соблюдай шаблон:<br>${adresParts.map(item => `<b>${item[0]}</b> (${item[1]})`).join(", ")}<br>Например: ул. Тверская, ш. Энтузиастов`;
		dom(`#${intaro}_deliveryAddress_text`)
			.dress(`<div class="adresTooltip tooltip"></div>`)
			.parent().toLast(`<div class="tooltip__content"><div class="tooltip__inner">${str}</div></div>`);

		//скопировать адрес в буфер
		const id = `#${intaro}_deliveryAddress_`;
		const copyValues = ['', ''];
		const adresPartsMap = {
			city: ``,
			street: ``,
			building: `д.`,
			housing: `корп.`,
			house: `стр.`,
			flat: `кв./офис`,
			block: `подъезд`,
			floor: `этаж`
		}
		Object.keys(adresPartsMap).map(key => {
			if ($(id + key).val()) copyValues[1] += `${adresPartsMap[key]} ${$(id + key).val()}, `;
			if ($(id + key).val() && ['city', 'street', 'building', 'housing', 'house'].includes(key)) copyValues[0] += `${adresPartsMap[key]} ${$(id + key).val()}, `;
		});
		copyValues.forEach((e, i) => copyValues[i] = e.slice(0, -2));
		const btn1 = copyBtn(copyValues[1], '❐ адрес целиком');
		const btn2 = copyBtn(copyValues[0], '❐ короткий адрес');
		dom(`<div id="ctrlcAdres" class="input-group input-group_small-wrap cleared"></div>`)
			.nextTo('#delivery-address-form')
			.toFirst('<label class="label-common" />')
			.toLast(btn1)
			.toLast(btn2);

		//очистить адрес
		const btn3 = dom(`<a class="complete-link input-small-link">очистить адрес</a>`);
		btn3.prevTo('#delivery-address-form').dress(`<div id="clearAdres" class="input-group input-group_small-wrap"></div>`);
		btn3.listen('click', () => dom('#delivery-address-form textarea, #delivery-address-form input').forEach(el => el.val('')));

		// переносим домофон к полям адреса
		dom(`#${intaro}_customFields_domofon`).parent().nextTo('#address-text');

		// переносим "узнать адрес у получателя"
		dom(`#${intaro}_customFields_uznat_adres_u_poluchatelya`).parent().prevTo('#clearAdres').parent();
	}

	price() {
		//изменяем заголовок: себестоимость -> стоимость для курьера
		dom(`label[for="${intaro}_deliveryNetCost"]`).txt('Стоимость для курьера');

		//если стоимость доставки не указана, то эмулируем клик
		if (!normalize.number(dom('#delivery-cost').val())) {
			dom('#order-delivery-cost__link-cost-manual').trigger('click');
			console.log('Стоимость доставки не указана, эмулируем клик');
		}
		if (!normalize.number($('#delivery-net-cost').val())) {
			dom('#order-delivery-net-cost__link-cost-manual').trigger('click');
			console.log('Себестоимость доставки не указана, эмулируем клик');
		}
	}

	courier() {
		//авто
		dom(`#${intaro}_customFields_auto_courier`).parent().nextTo('#intaro-crm-deliveries').css('padding-top', '10px');
		//переносим поле "оповещение курьера"
		dom(`#${intaro}_customFields_courier_notified`).parent().nextTo('#intaro-crm-deliveries').css('padding-top', '10px');
	}
}

