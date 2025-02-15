import { indexes, shops, couriersDataForSvodka, noFlowers } from './orders_table';
import { shopIcon, adresParts, iconsSVG, fakeClients } from '../mappings';
import { makeDate, ctrlc, normalize, retailcrm } from '@helpers';

export async function order($tr) {

	const orderId = normalize.int($tr.data('url'));
	const shopDb = shops.get().find(s => s.shop_title === getNative('Магазин'));
	const order = await retailcrm.get.order.byId(orderId, shopDb?.shop_crm_id);
	const sku = order.items.find(item => typeof item.properties === 'object' && item.properties?.artikul?.value)?.properties.artikul.value.match(/^\d+/)?.[0];

	type();
	coloredRow(); //подкрашиваем строки
	batchHide(); //пакетное сокрытие
	logo();
	comments();
	onanim();
	telegram();
	phoneZakazchika();
	phonePoluchatelya();
	orderIdClickable();
	noIdentic();
	productsSummary();
	money();
	adres();
	warnings();
	courier();
	sostav();
	customCardText();
	warningFlorist();
	warningCourier();
	lovixlube();
	printCard();

	function logo() {
		td('Магазин').prepend(`<img src="${shopIcon(get('Магазин'))}" class="logo" />`);
		td('Магазин').children('.native').hide();
	}
	function type() {
		$tr.each((_, tr) => $tr.children('td').each((i, td) => $(td).attr('type', indexes.get()[i])));
	}
	function coloredRow() {
		let color;
		if (get('Магазин') == 'stay true Flowers') color = 'fffaff';
		if (get('Покупатель') == 'списание') color = 'fff3ee';
		if (get('Покупатель') == 'наличие') color = 'e6fff1';
		if (get('Букеты в заказе') && get('Букеты в заказе').match(/ДОНАТОШНАЯ/)) color = 'ffffe9';
		if (!color) return;
		$tr.children().css('background-color', '#' + color);
	}
	function batchHide() {
		const conditions = [
			fakeClients.includes(get('Покупатель')),
			get('Букеты в заказе') && get('Букеты в заказе').match(/ДОНАТОШНАЯ/),
			get('Статус заказа') == 'разобран'
		]
		if (conditions.includes(true)) $tr.addClass('batchHide');
	}
	function comments() {
		let texts = [];
		let courier = get('Комментарий клиента') ? get('Комментарий клиента').replace(/\n/g, '<br>') : '';
		let florist = get('Комментарий оператора') ? get('Комментарий оператора').replace(/\n/g, '<br>') : '';
		if (florist) { texts.push(`<b>Флористу</b>:<br>${florist}`); }
		if (courier) { texts.push(`<b>Курьеру</b>:<br>${courier}`); }
		td('Чат').html(texts.join('<br><br>'));
	}
	function onanim() {
		if (!get('Аноним')) return;
		td('Покупатель').addClass('addComment onanim');
	}
	function lovixlube() {
		if (!get('Добавить лубрикант Lovix')) return;
		td('Букеты в заказе').append(iconsSVG.lovixlube);
	}
	function telegram() {
		const telegram = get('Мессенджер заказчика (в заказе)');
		if (!telegram) return;
		const name = get('Покупатель');
		const icon = iconsSVG.telegram;
		td('Покупатель').children('.native').html(`<a href="https://t.me/${telegram}" title="${telegram}" target="blank" class="telegram">${icon}${name}</a>`);
	}
	function phoneZakazchika() {
		if (!get('Контактный телефон')) return;
		$(`<a class="phoneZakazchika">${get('Контактный телефон').replace(/^\+7|8/, '')}</a>`).on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc(get('Контактный телефон'));
		}).appendTo(td('Покупатель'));
	}
	function phonePoluchatelya() {
		if (!get('Телефон получателя')) return;
		$(`<a class="copyBtn phonePoluchatelya inline-tooltip-trigger"></a>`).appendTo(td('Адрес доставки')).on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc(get('Телефон получателя'));
		});
		$(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip phonePoluchatelya">${get('Телефон получателя')} / ${get('Имя получателя')}</div>`).appendTo(td('Адрес доставки'));
	}
	function orderIdClickable() {
		const id = td('Номер').find('a');
		id.on('click', e => {
			e.preventDefault();
			ctrlc(id.text());
		});
		id.parents('tr').children('td:first').append('<br>').append(id);
	}
	function noIdentic() {
		if (get('Выебри карточку') != 'без айдентики') return;
		td('Выебри карточку').children('.native').css('background-color', '#f3ff92');
	}
	function productsSummary() {
		td('Букеты в заказе').children('.native').html(get('Букеты в заказе'));
	}
	function money() {
		let paid = 0;
		const summa = get('Сумма') ? parseInt(get('Сумма').replace(/[^\d]/, '')) : 0;
		const payments = get('Сумма оплаты') ? get('Сумма оплаты').replaceAll(/(\d)\s(\d)/g, '$1$2').match(/\d+/g) : 0;
		if (Array.isArray(payments)) {
			for (let i = 0; i < payments.length; i++) {
				paid += parseInt(payments[i]);
			}
		}
		if (summa != paid) {
			$(`<div class="paid">Оплачено:<br>${paid}</div>`).appendTo(td('Сумма'));
		}
		const discount = get('Скидка в процентах');
		if (discount && parseInt(discount) > 0) {
			$(`<div class="discount">${discount}%</div>`).appendTo(td('Сумма'));
		}
	}
	function adres() {
		let adres = getNative('Адрес доставки');
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
		td('Адрес доставки').children('.native').html(adres).find('.yadres').on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc($(e.target).text());
		});

	}
	function courier() {
		//стоимость доставки
		const price = () => {
			td('Курьер').append(`<div class="price">${get('Себестоимость доставки') || ''}</div>`);
		}
		//автокурьер
		const auto = () => {
			if (!get('Автокурьер')) return;
			td('Курьер').prepend(`${iconsSVG.auto_courier}<br>`);
		}
		//самовывоз
		const samovyvoz = () => {
			if (get('Тип доставки') == 'Самовывоз') {
				td('Курьер').children('.native').text('Самовывоз');
				return true;
			}
			return false;
		}
		//статус заказа
		const noDostavkaStatus = () => {
			return (['Витрина', 'Разобран'].includes(get('Статус заказа')));
		}
		//данные курьера
		const data = () => {
			if (get('Адрес доставки')) $(`<a class="copyBtn"></a>`).appendTo(td('Курьер'));
			//кликабельный курьер
			if (!td('Курьер').find('a:not(.copyBtn)').length) {
				let сourierName = getNative('Курьер');
				td('Курьер').find('.native').replaceWith(() => $('<a/>', { 'class': 'native', 'href': '#', 'text': сourierName }));
			}
			td('Курьер').find('a').on('click', e => {
				e.preventDefault();
				e.stopPropagation();

				let output = '';
				const today = makeDate();
				const tomorrow = makeDate(today.obj, 1);
				const tomtomorrow = makeDate(today.obj, 2);
				const m = get('Дата доставки').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
				const deliveryDate = makeDate(new Date(m[3], m[2] - 1, m[1]));
				if (deliveryDate.str == today.str) {
					output += `сегодня (${get('Дата доставки')})`;
				} else if (deliveryDate.str == tomorrow.str) {
					output += `завтра (${get('Дата доставки')})`;
				} else if (deliveryDate.str == tomtomorrow.str) {
					output += `послезавтра (${get('Дата доставки')})`;
				} else {
					output += get('Дата доставки');
				}
				output += ' ' + get('Время доставки');
				if (get('Автокурьер')) output += `\nДоставка на своем автомобиле или на такси!`;
				if (getNative('Адрес доставки')) {
					output += '\n' + ($(e.target).is('.copyBtn') ? getNative('Адрес доставки').replace(/(,\s(?:кв|эт|под)\..+$)/, '') : getNative('Адрес доставки'));
				}
				if (!$(e.target).is('.copyBtn')) {
					if (get('Комментарий клиента')) output += '\n' + get('Комментарий клиента');
					if (get('Телефон получателя') || get('Имя получателя')) output += '\n' + get('Телефон получателя') + ' / ' + get('Имя получателя');
				}
				if (get('Себестоимость доставки')) output += '\n' + get('Себестоимость доставки');
				ctrlc(output);
			});
		}
		//данные курьера для сводки
		const svodka = () => {
			const name = getNative('Курьер');
			const price = normalize.int(td('Курьер').children('.price').text());
			if (!name || !price) return;
			let data = {
				name: name,
				price: price,
				phone: getNative('Телефон курьера'),
			};
			if (name == 'Другой курьер') {
				data.comments = get('Комментарий оператора');
			}
			const description = getNative('Примечания курьера');
			if (description) {
				try {
					data = { ...data, ...JSON.parse(description) }
				} catch (e) { }
			}
			couriersDataForSvodka.append(data);
		}
		//индикатор, оповещен ли курьер
		const notifyIndicator = () => {
			if (!needCourierNonify()) return;

			const $thisTd = td('Курьер');
			const status = order.customFields.courier_notified;
			const title = getTitle(status);
			const className = getClass(status);
			const $btn = $(`<div class="${className}" title="${title}"></div>`);
			const $warn = $thisTd.children('.warn');

			$btn.appendTo($warn);
			$thisTd.attr('data-notified', String(status));
			if ($thisTd.data('notified')) return;

			$btn.on('click', async (e) => {
				e.preventDefault();
				e.stopPropagation();
				order.customFields.courier_notified = true;
				const response = await retailcrm.edit.order(orderId, shopDb?.shop_crm_code, order);
				toggleIndicator(response);
				if (response && $thisTd.find('.warn .inline-tooltip').text().trim() === 'курьер не уведомлен') {
					$thisTd.find('.warn').hide();
				}
			});

			function toggleIndicator(toggle = true) {
				order.customFields.courier_notified = toggle;
				$thisTd.attr('data-notified', String(toggle));
				$btn.attr('title', getTitle(toggle));
				$btn.attr('class', getClass(toggle));
			}

			function getTitle(status) {
				return 'курьер ' + (status ? '' : 'не ') + 'уведомлен';
			}

			function getClass(status) {
				return 'notify ' + (status ? 'complete' : 'cancel');
			}
		}

		auto();
		if (samovyvoz()) return;
		if (noDostavkaStatus()) return;
		price();
		data();
		svodka();
		notifyIndicator();
	}
	function needCourierNonify() {
		const conditions = [
			['Выполнен', 'Разобран'].includes(get('Статус заказа')), //завершеные заказы
			fakeClients.includes(get('Покупатель')), //не настоящий клиент
			!!get('Букеты в заказе')?.match(/ДОНАТОШНАЯ/), //донат
			!order.delivery.data.id, //курьер не назначен
			order.customFields.courier_notified //курьер уведомлен
		];
		return !conditions.includes(true);
	}
	function sostav() {
		if (!get('Состав')) return;

		//товары в составе
		const products = [];
		if (get('Букеты в заказе')) {
			getNative('Букеты в заказе').split('т),').forEach(product => {
				product = product.replace(/\(\d+\sш.*$/, ''); //удаляем штуки
				product = product.replace(/\s*\(.*\)/, ''); //убираем все в скобочках
				product = product.replace(/\s-\s.*$/, ''); //убираем все после дефиса
				product = product.trim();
				products.push(product);
			});
		}

		//цветы в составе
		const flowers = [];
		get('Состав').replaceAll(/шт\./g, 'шт.*separator*').split('*separator*').forEach(item => {
			item = item.trim();
			if (!item) return;
			item = item.replace(/\s*—.*$/, ''); //убираем все после навзания цветка
			item = item.replace(/\sодн|\sкуст/, ''); //убираем одн и куст (роза одн)
			item = item.replace(/\s-\s.*$/, ''); //убираем все после дефиса
			item = item.replace(/\s\d*$/, ''); //убираем цену			
			if (noFlowers.get().includes(item) || products.includes(item)) return;
			flowers.push(item.toLowerCase());
		});
		if (!flowers.length) return;
		const flowersString = Array.from(new Set(flowers)).sort().join(', '); //сортируем по алфавиту и удаляем дубликаты + формируем строку

		//copyBtn
		$('<a class="copyBtn inline-tooltip-trigger"></a>').appendTo(td('Букеты в заказе')).on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc(flowersString);
		});
		$(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip">${flowersString}</div>`).appendTo(td('Букеты в заказе'));
	}
	function customCardText() {
		if (!get('Текст в карточку')) return;
		if (!get('Выебри карточку')) td('Выебри карточку').children('.native').text('со своим текстом');
		if (get('Выебри карточку') != 'со своим текстом') td('Выебри карточку').addClass('addComment customCardText');
		$('<a class="copyBtn inline-tooltip-trigger"></a>').appendTo(td('Выебри карточку')).on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc(get('Текст в карточку'));
		});
		$(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip">${get('Текст в карточку')}</div>`).appendTo(td('Выебри карточку'));
	}
	async function printCard() {
		if (!get('Выебри карточку')) return;
		if (!order || !sku) return;
		if (!sku) return;
		$(`<a class="print_card" href="https://php.2steblya.ru/print_card?order_id=${orderId}&sku=${sku}&shop_crm_id=${shopDb?.shop_crm_id}" target="_blank">⎙</a>`).appendTo(td('Выебри карточку'));
	}
	function warningFlorist() {
		if (!get('Пометить для флориста и/или администратора')) return;
		const $warnCont = td('Чат').children('.warn');
		const $warnIcon = $(iconsSVG.warning);
		$warnCont?.prepend($warnIcon);
	}
	function warningCourier() {
		//проверяем исключения
		const exceptions = [
			$tr.is('.batchHide'), // технический заказ
			get('Тип доставки') != 'Доставка курьером', // доставка не курьером
			fakeClients.includes(get('Покупатель')), // не настоящий клиент
			!!get('Букеты в заказе')?.match(/ДОНАТОШНАЯ/) //донат
		];
		if (exceptions.includes(true)) return;

		//данные получателя, которых не хватает
		const data = {
			'дата доставки': get('Дата доставки'),
			'время доставки': get('Время доставки'),
			'имя получателя': get('Имя получателя'),
			'телефон получателя': get('Телефон получателя'),
			'адрес доставки': getNative('Адрес доставки'),
			'стоимость доставки': get('Себестоимость доставки'),
			'курьер не уведомлен': needCourierNonify() ? null : 'need'
		}
		const nullItems = [];
		for (const [key, value] of Object.entries(data)) {
			if (!value) nullItems.push(key);
		}
		if (!nullItems.length) return;

		const $warnTooltip = $(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip">${nullItems.join('<br>')}</div>`);
		const $warnIcon = $(iconsSVG.warning);
		const $warnCont = td('Курьер').children('.warn');
		const $warnIconTooltip = $('<div class="warn_icon_tooltip">');

		$warnIcon.addClass('inline-tooltip-trigger');
		$warnIconTooltip?.prepend($warnIcon);
		$warnIconTooltip?.append($warnTooltip);
		$warnIconTooltip.prependTo($warnCont);
	}
	function warnings() {
		['Чат', 'Курьер'].forEach(c => {
			td(c)?.append('<div class="warn"></div>');
		});
	}




	function td(title) {
		return $tr.children('td').eq(indexes.get()[title.toLowerCase()]);
	}
	function get(title) {
		return gt(td(title));
	}
	function getNative(title) {
		return gt(td(title).children('.native'));
	}
	function gt(node) {
		let content = node.clone();
		content.find('.list-status-comment').remove(); // удаляем комментарий к статусу
		content.find('br').replaceWith("\n"); //заменяем переносы на новые строки
		content = content.text().trim();
		const excludedValues = new Set(['—', 'Нет', '0 ₽', '']);
		return excludedValues.has(content) ? null : content;
	}

}