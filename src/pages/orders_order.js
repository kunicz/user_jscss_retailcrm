import { indexes, getNoFlowers, getCouriersDataForSvodka, setCouriersDataForSvodka } from './orders_table';
import { getShopIcon, adresParts, makeDateFromDate, makeDateFromToday, ctrlc, iconsSVG, fakeClients } from '../helpers';

export class Order {
	constructor(node) {
		this.tr = node;
		this.type();
		this.coloredRow(); //подкрашиваем строки
		this.batchHide(); //пакетное сокрытие
		this.logo();
		this.comments();
		this.onanim();
		this.telegram();
		this.phoneZakazchika();
		this.phonePoluchatelya();
		this.orderId();
		this.noIdentic();
		this.productsSummary();
		this.money();
		this.adres();
		this.courier();
		this.sostav();
		this.customCardText();
		this.warningFlorist();
		this.warningCourier();
		this.lovixlube();
	}

	logo() {
		this.td('Магазин').html(`<img src="${getShopIcon(this.get('Магазин'))}" class="logo" />`);
	}
	type() {
		$(this.tr).each((_, tr) => $(tr).children('td').each((i, td) => $(td).attr('type', indexes[i])));
	}
	coloredRow() {
		let color;
		if (this.get('Магазин') == 'stay true Flowers') color = 'fffaff';
		if (this.get('Покупатель') == 'списание') color = 'fff3ee';
		if (this.get('Покупатель') == 'наличие') color = 'e6fff1';
		if (this.get('Букеты в заказе') && this.get('Букеты в заказе').match(/ДОНАТОШНАЯ/)) color = 'ffffe9';
		if (!color) return;
		this.tr.children().css('background-color', '#' + color);
	}
	batchHide() {
		const conditions = [
			fakeClients.includes(this.get('Покупатель')),
			this.get('Букеты в заказе') && this.get('Букеты в заказе').match(/ДОНАТОШНАЯ/),
			this.get('Статус заказа') == 'разобран'
		]
		if (conditions.includes(true)) this.tr.addClass('batchHide');
	}
	comments() {
		let texts = [];
		let courier = this.get('Комментарий клиента') ? this.get('Комментарий клиента').replace(/\n/g, '<br>') : '';
		let florist = this.get('Комментарий оператора') ? this.get('Комментарий оператора').replace(/\n/g, '<br>') : '';
		if (florist) { texts.push(`<b>Флористу</b>:<br>${florist}`); }
		if (courier) { texts.push(`<b>Курьеру</b>:<br>${courier}`); }
		this.td('Чат').html(texts.join('<br><br>'));
	}
	onanim() {
		if (!this.get('Аноним')) return;
		this.td('Покупатель').addClass('addComment onanim');
	}
	lovixlube() {
		if (!this.get('Добавить лубрикант Lovix')) return;
		this.td('Букеты в заказе').append(iconsSVG.lovixlube);
	}
	telegram() {
		const telegram = this.get('Мессенджер заказчика (в заказе)');
		if (!telegram) return;
		const name = this.get('Покупатель');
		const icon = iconsSVG.telegram;
		this.td('Покупатель').children('.native').html(`<a href="https://t.me/${telegram}" title="${telegram}" target="blank" class="telegram">${icon}${name}</a>`);
	}
	phoneZakazchika() {
		if (!this.get('Контактный телефон')) return;
		$(`<a class="phoneZakazchika">${this.get('Контактный телефон').replace(/^\+7|8/, '')}</a>`).on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc(this.get('Контактный телефон'));
		}).appendTo(this.td('Покупатель'));
	}
	phonePoluchatelya() {
		if (!this.get('Телефон получателя')) return;
		$(`<a class="copyBtn phonePoluchatelya inline-tooltip-trigger"></a>`).appendTo(this.td('Адрес доставки')).on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc(this.get('Телефон получателя'));
		});
		$(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip phonePoluchatelya">${this.get('Телефон получателя')} / ${this.get('Имя получателя')}</div>`).appendTo(this.td('Адрес доставки'));
	}
	orderId() {
		const id = this.td('Номер').find('a');
		id.on('click', e => {
			e.preventDefault();
			ctrlc(id.text());
		});
		id.parents('tr').children('td:first').append('<br>').append(id);
	}
	noIdentic() {
		if (this.get('Выебри карточку') != 'без айдентики') return;
		this.td('Выебри карточку').children('.native').css('background-color', '#f3ff92');
	}
	productsSummary() {
		this.td('Букеты в заказе').children('.native').html(this.get('Букеты в заказе'));
	}
	money() {
		let paid = 0;
		const summa = this.get('Сумма') ? parseInt(this.get('Сумма').replace(/[^\d]/, '')) : 0;
		const payments = this.get('Сумма оплаты') ? this.get('Сумма оплаты').replaceAll(/(\d)\s(\d)/g, '$1$2').match(/\d+/g) : 0;
		if (Array.isArray(payments)) {
			for (let i = 0; i < payments.length; i++) {
				paid += parseInt(payments[i]);
			}
		}
		if (summa != paid) {
			$(`<div class="paid">Оплачено:<br>${paid}</div>`).appendTo(this.td('Сумма'));
		}
		const discount = this.get('Скидка в процентах');
		if (discount && parseInt(discount) > 0) {
			$(`<div class="discount">${discount}%</div>`).appendTo(this.td('Сумма'));
		}
	}
	adres() {
		let adres = this.getNative('Адрес доставки');
		if (!adres) return;
		//удаляем дублирующиеся пробелы
		adres = adres.replace(/\s{2,}/, '');
		//убираем москву
		adres = adres.replace('Москва город, ', '');
		adres = adres.replace('г. Москва, ', '');
		//удаляем индекс
		adres = adres.replace(/^\d+,\s/, '');
		//кликабельный адрес (город, улица, дом)
		adres = adres.replace(new RegExp(`(^.*(?:${adresParts.map(i => i[0]).join('|')})\\.\\s(?:[^,])+,\\sд\.\\s(?:[^,])+(?:,\\s(?:корп\\.|стр\\.)\\s[^,]+)*)`), '<a class="yadres">$1</a>');
		adres = adres.replace(/(.+)(?:,\sметро\s(.+))/, 'м. $2<br>$1');
		this.td('Адрес доставки').children('.native').html(adres).find('.yadres').on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc($(e.target).text());
		});

	}
	courier() {
		//стоимость доставки
		const price = () => {
			this.td('Курьер').append(`<div class="price">${this.get('Себестоимость доставки') || ''}</div>`);
		}
		//автокурьер
		const auto = () => {
			if (!this.get('Автокурьер')) return;
			this.td('Курьер').prepend(`<svg class="auto" width="18px" height="18px" fill="#0052cc" style="" viewBox="0 0 700 500" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g transform="matrix(1.28628,0,0,1.28628,-100.203,-110.147)"><path d="M235.95,332.29C197.329,332.29 166.055,363.599 166.055,402.204C166.055,440.809 197.328,472.083 235.95,472.083C274.572,472.083 305.864,440.81 305.864,402.204C305.86,363.599 274.555,332.29 235.95,332.29ZM235.95,434C218.415,434 204.169,419.773 204.169,402.219C204.169,384.668 218.415,370.457 235.95,370.457C253.485,370.457 267.731,384.684 267.731,402.219C267.731,419.754 253.485,434 235.95,434Z" style="fill-rule:nonzero;"/><path d="M495.27,332.29C456.649,332.29 425.34,363.599 425.34,402.204C425.34,440.809 456.649,472.083 495.27,472.083C533.891,472.083 565.165,440.81 565.165,402.204C565.169,363.599 533.876,332.29 495.27,332.29ZM495.27,434C477.735,434 463.489,419.773 463.489,402.219C463.489,384.668 477.735,370.457 495.27,370.457C512.805,370.457 527.051,384.684 527.051,402.219C527.051,419.754 512.805,434 495.27,434Z" style="fill-rule:nonzero;"/><path d="M594.32,305.18L594.32,271.266C594.32,256.356 606.359,244.282 621.254,244.176C620.012,194.738 609.879,148.645 591.399,126.766C568.508,99.657 550.711,87.899 494.833,87.899L280.841,87.899C261.837,87.899 253.63,98.887 246.907,118.419C230.001,167.575 215.18,219.569 215.18,219.569C215.18,219.569 116.024,232.292 93.15,234.846C79.939,236.315 76.947,252.225 79.673,271.264L106.712,271.264C118.892,271.264 128.743,281.151 128.743,293.295C128.743,305.459 118.891,315.346 106.712,315.346L86.954,315.346C101.181,390.666 111.645,418.666 143.899,420.276C142.797,414.432 142.114,408.378 142.114,402.217C142.114,350.416 184.13,308.401 235.93,308.401C287.731,308.401 329.746,350.417 329.746,402.217C329.746,408.448 329.062,414.518 327.926,420.436L403.211,420.436C402.039,414.522 401.39,408.448 401.39,402.217C401.39,350.416 443.406,308.401 495.206,308.401C547.007,308.401 588.952,350.417 588.952,402.217C588.952,408.201 588.358,414.045 587.273,419.733C618.23,415.901 616.48,357.452 618.457,332.006C604.937,330.518 594.312,319.123 594.312,305.178L594.32,305.18ZM253.05,213.653C253.839,209.786 279.702,123.512 279.702,123.512L396.412,123.512L429.541,213.653L253.05,213.653ZM467.67,213.653L434.576,123.512L469.42,123.512C508.779,123.512 526.748,136.934 537.916,149.43C549.482,162.364 553.717,172.129 558.443,213.657L467.67,213.653Z" style="fill-rule:nonzero;"/></g></svg><br>`);
		}
		//самовывоз
		const samovyvoz = () => {
			if (this.get('Тип доставки') == 'Самовывоз') {
				this.td('Курьер').children('.native').text('Самовывоз');
				return true;
			}
			return false;
		}
		//статус заказа
		const noDostavkaStatus = () => {
			return (['Витрина', 'Разобран'].includes(this.get('Статус заказа')));
		}
		//данные курьера
		const data = () => {
			if (this.get('Адрес доставки')) $(`<a class="copyBtn"></a>`).appendTo(this.td('Курьер'));
			this.td('Курьер').find('a').on('click', e => {
				e.preventDefault();
				e.stopPropagation();

				let output = '';
				const today = makeDateFromToday();
				const tomorrow = makeDateFromToday(1);
				const tomtomorrow = makeDateFromToday(2);
				const m = this.get('Дата доставки').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
				const deliveryDate = makeDateFromDate(new Date(m[3], m[2] - 1, m[1]));
				if (deliveryDate.str == today.str) {
					output += `сегодня (${this.get('Дата доставки')})`;
				} else if (deliveryDate.str == tomorrow.str) {
					output += `завтра (${this.get('Дата доставки')})`;
				} else if (deliveryDate.str == tomtomorrow.str) {
					output += `послезавтра (${this.get('Дата доставки')})`;
				} else {
					output += this.get('Дата доставки');
				}
				output += ' ' + this.get('Время доставки');
				if (this.get('Автокурьер')) output += `\nДоставка на своем автомобиле или на такси!`;
				if (this.getNative('Адрес доставки')) {
					output += '\n' + ($(e.target).is('.copyBtn') ? this.getNative('Адрес доставки').replace(/(,\s(?:кв|эт|под)\..+$)/, '') : this.getNative('Адрес доставки'));
				}
				if (!$(e.target).is('.copyBtn')) {
					if (this.get('Комментарий клиента')) output += '\n' + this.get('Комментарий клиента');
					if (this.get('Телефон получателя') || this.get('Имя получателя')) output += '\n' + this.get('Телефон получателя') + ' / ' + this.get('Имя получателя');
				}
				if (this.get('Себестоимость доставки')) output += '\n' + this.get('Себестоимость доставки');
				ctrlc(output);
			});
		}
		//данные курьера для сводки
		const svodka = () => {
			const name = this.getNative('Курьер'); if (!name) return;
			const price = parseInt(this.td('Курьер').children('.price').text().replaceAll(/[^0-9]/g, '')); if (!price) return;
			let data = {
				name: name,
				price: price,
				phone: this.getNative('Телефон курьера'),
			};
			if (name == 'Другой курьер') {
				data.comments = this.get('Комментарий оператора');
			}
			if (this.getNative('Примечания курьера')) {
				data = { ...data, ...JSON.parse(this.getNative('Примечания курьера')) }
			}
			const courierData = getCouriersDataForSvodka();
			courierData.push(data);
			setCouriersDataForSvodka(courierData);
		}

		auto();
		if (samovyvoz()) return;
		if (noDostavkaStatus()) return;
		price();
		data();
		svodka();
	}
	sostav() {
		if (!this.get('Состав')) return;

		//товары в составе
		const products = [];
		if (this.get('Букеты в заказе')) {
			this.getNative('Букеты в заказе').split('т),').forEach(product => {
				product = product.replace(/\(\d+\sш.*$/, ''); //удаляем штуки
				product = product.replace(/\s*\(.*\)/, ''); //убираем все в скобочках
				product = product.replace(/\s-\s.*$/, ''); //убираем все после дефиса
				product = product.trim();
				products.push(product);
			});
		}

		//цветы в составе
		const flowers = [];
		this.get('Состав').replaceAll(/шт\./g, 'шт.*separator*').split('*separator*').forEach(item => {
			item = item.trim();
			if (!item) return;
			item = item.replace(/\s*—.*$/, ''); //убираем все после навзания цветка
			item = item.replace(/\sодн|\sкуст/, ''); //убираем одн и куст (роза одн)
			item = item.replace(/\s-\s.*$/, ''); //убираем все после дефиса
			item = item.replace(/\s\d*$/, ''); //убираем цену			
			if (getNoFlowers().includes(item) || products.includes(item)) return;
			flowers.push(item.toLowerCase());
		});
		if (!flowers.length) return;
		const flowersString = Array.from(new Set(flowers)).sort().join(', '); //сортируем по алфавиту и удаляем дубликаты + формируем строку

		//copyBtn
		$('<a class="copyBtn inline-tooltip-trigger"></a>').appendTo(this.td('Букеты в заказе')).on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc(flowersString);
		});
		$(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip">${flowersString}</div>`).appendTo(this.td('Букеты в заказе'));
	}
	customCardText() {
		if (!this.get('Текст в карточку')) return;
		if (!this.get('Выебри карточку')) this.td('Выебри карточку').children('.native').text('со своим текстом');
		if (this.get('Выебри карточку') != 'со своим текстом') this.td('Выебри карточку').addClass('addComment customCardText');
		$('<a class="copyBtn inline-tooltip-trigger"></a>').appendTo(this.td('Выебри карточку')).on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc(this.get('Текст в карточку'));
		});
		$(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip">${this.get('Текст в карточку')}</div>`).appendTo(this.td('Выебри карточку'));
	}
	warningFlorist() {
		if (!this.get('Пометить для флориста и/или администратора')) return;
		this.td('Чат').prepend(iconsSVG.warning);
	}
	warningCourier() {
		//проверяем исключения
		const exceptions = [
			this.tr.is('.batchHide'),
			this.get('Тип доставки') != 'Доставка курьером',
			new RegExp(fakeClients.join('|')).test(this.get('Покупатель'))
		];
		if (exceptions.includes(true)) return;

		//данные получателя, которых не хватает
		const data = {
			'дата доставки': this.get('Дата доставки'),
			'время доставки': this.get('Время доставки'),
			'имя получателя': this.get('Имя получателя'),
			'телефон получателя': this.get('Телефон получателя'),
			'адрес доставки': this.getNative('Адрес доставки'),
			'стоимость доставки': this.get('Себестоимость доставки')
		}
		const nullItems = [];
		for (const [key, value] of Object.entries(data)) {
			if (!value) nullItems.push(key);
		}
		if (!nullItems.length) return;
		this.td('Курьер')
			.append($(iconsSVG.warning).addClass('inline-tooltip-trigger'))
			.append(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip">${nullItems.join('<br>')}</div>`);
	}




	td(title) {
		return this.tr.children('td').eq(indexes[title.toLowerCase()]);
	}
	get(title, native = false) {
		return this.gt(this.td(title));
	}
	getNative(title) {
		return this.gt(this.td(title).children('.native'));
	}
	gt(node) {
		let content = node.clone();
		content.find('br').replaceWith("\n"); //заменяем переносы на новые строки
		content = content.text().trim();
		if (['—', 'Нет', '0 ₽', ''].includes(content)) return null;
		return content;
	}
}