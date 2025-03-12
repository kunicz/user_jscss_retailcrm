import { indexes, shops, noFlowers } from '@modules/orders/table/';
import { shopIcon, iconsSVG, fakeClients } from '@src/mappings';
import adres from '@modules/order/adres';
import normalize from '@helpers/normalize';
import { ctrlc } from '@helpers/clipboard';
import retailcrm from '@helpers/retailcrm';
import dates from '@helpers/dates';
import { RESERVED_ARTICLES } from '@root/config';

export default async ($tr) => {

	const orderId = normalize.int($tr.data('url'));
	const shopDb = shops.find(s => s.shop_title === getNative('Магазин'));
	const order = await retailcrm.get.order.byId(orderId);
	const artikul = order.items.find(item => typeof item.properties === 'object' && item.properties?.artikul?.value)?.properties.artikul.value;
	const probableSku = parseInt(artikul?.match(/^\d+/)?.[0]);
	const sku = RESERVED_ARTICLES.includes(probableSku) ? artikul : probableSku;

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
	address();
	clientMsg();
	warnings();
	courier();
	sostav();
	gamma();
	customCardText();
	warningFlorist();
	lovixlube();
	printCard();

	/**
	 * проставляет ячейкам тип (название колонки)
	 */
	function type() {
		$tr.each((_, tr) => $tr.children('td').each((i, td) => $(td).attr('type', indexes[i])));
	}

	/**
	 * лого вместо названия магазина для клмпактности
	 */
	function logo() {
		const $td = td('Магазин');
		$td.prepend(`<img src="${shopIcon(get('Магазин'))}" class="logo" />`);
		$td.children('.native').hide();
	}

	/**
	 * добавляет контейнер для варнингов в указанные ячейки
	 */
	function warnings() {
		['Чат', 'Курьер'].forEach(c => {
			td(c)?.append('<div class="warn"></div>');
		});
	}

	/**
	 * подкрашивает строки, которые необходимо выделить (необычные заказы)
	 */
	function coloredRow() {
		let color;
		if (get('Магазин') == 'stay true Flowers') color = 'fffaff';
		if (get('Покупатель') == 'списание') color = 'fff3ee';
		if (get('Покупатель') == 'наличие') color = 'e6fff1';
		if (!!get('Букеты в заказе')?.match(/ДОНАТОШНАЯ/)) color = 'ffffe9';
		if (!color) return;
		$tr.children().css('background-color', '#' + color);
	}

	/**
	 * помечает заказы, которые не считаются важными, чтоб их можно было скрыть
	 */
	function batchHide() {
		if (
			fakeClients.includes(get('Покупатель')) ||
			!!get('Букеты в заказе')?.match(/ДОНАТОШНАЯ/) ||
			get('Статус заказа') === 'разобран'
		) {
			$tr.addClass('batchHide');
		}
	}

	/**
	 * парсит комментарии и формирует их в единый текст
	 */
	function comments() {
		const texts = [];
		const courier = get('Комментарий клиента')?.replace(/\n/g, '<br>') || '';
		const florist = get('Комментарий оператора')?.replace(/\n/g, '<br>') || '';
		if (florist) { texts.push(`<b>Флористу</b>:<br>${florist}`); }
		if (courier) { texts.push(`<b>Курьеру</b>:<br>${courier}`); }
		td('Чат').html(texts.join('<br><br>'));
	}

	/**
	 * помечает ячейку, если клиент аноним
	 */
	function onanim() {
		if (!get('Аноним')) return;
		td('Покупатель').addClass('addComment onanim');
	}

	/**
	 * добавляет в ячейку иконку смазки, если она в заказе
	 */
	function lovixlube() {
		if (!get('Добавить лубрикант Lovix')) return;
		td('Букеты в заказе').append(iconsSVG.lovixlube);
	}

	/**
	 * создает кликабельную ссылку на телеграм клиента, если есть
	 */
	function telegram() {
		const telegram = get('Мессенджер заказчика (в заказе)');
		if (!telegram) return;
		const name = get('Покупатель');
		const icon = iconsSVG.telegram;
		const a = `<a href="https://t.me/${telegram}" title="${telegram}" target="blank" class="telegram">${icon}${name}</a>`;
		td('Покупатель').children('.native').html(a);
	}

	/**
	 * создает кликабельную ссылку, добавляющую в буфер номер телефона клиента
	 */
	function phoneZakazchika() {
		const phone = get('Контактный телефон')
		if (!phone) return;
		const a = $(`<a class="phoneZakazchika">${phone.replace(/^\+7|8/, '')}</a>`);
		a.appendTo(td('Покупатель'));
		a.on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc(get('Контактный телефон'));
		});
	}

	/**
	 * создает copyBtn для номера телефона получателя
	 * у кнопки тултип с телефоном и именем получателя
	 */
	function phonePoluchatelya() {
		const phone = get('Телефон получателя');
		if (!phone) return;
		const name = get('Имя получателя');
		const $copyBtn = copyBtn(phone);
		$copyBtn.appendTo(td('Адрес доставки'));
		inlineTooltip($copyBtn, phone + (name ? ` / ${name}` : ''));
	}

	/**
	 * создает кликабельную ссылку, добавляющую в буфер id заказа
	 */
	function orderIdClickable() {
		const id = td('Номер').find('a');
		id.on('click', e => {
			e.preventDefault();
			ctrlc(id.text());
		});
		id.parents('tr').children('td:first').append('<br>').append(id);
	}

	/**
	 * помечает заказ без айдентики
	 */
	function noIdentic() {
		if (get('Выебри карточку') != 'без айдентики') return;
		td('Выебри карточку').children('.native').css('background-color', '#f3ff92');
	}

	/**
	 * добавляет список товаров как html, чтоб работали переносы строк br
	 */
	function productsSummary() {
		td('Букеты в заказе').children('.native').html(get('Букеты в заказе'));
	}

	/**
	 * все финансовые данные по заказу (сумма заказа, сумма оплаты и скидки) в одной ячейке
	 */
	function money() {
		const paid = normalize.int(get('Оплачено'));
		const shouldPayed = sumPayments(get('Сумма оплаты') || '');
		const discount = parseInt(get('Скидка в процентах') || 0);
		let text = 'Оплачено:<br>';
		text += paid;
		if (shouldPayed && shouldPayed != paid) text += ` из ${shouldPayed}`
		$(`<div class="paid">${text}</div>`).appendTo(td('Сумма'));

		if (discount > 0) {
			$(`<div class="discount">${discount}%</div>`).appendTo(td('Сумма'));
		}

		function sumPayments(text) {
			const amounts = text.match(/\d[\d\s]*₽/g) || []; // Ищем все суммы с ₽
			return amounts.reduce((sum, amount) => {
				const numericValue = parseInt(amount.replace(/\s|₽/g, ''), 10); // Убираем пробелы и ₽
				return sum + (isNaN(numericValue) ? 0 : numericValue);
			}, 0);
		}
	}

	/**
	 * делает часть адреса (город,улица,дом) доставки кликабельным, добавдяет в буфер
	 */
	function address() {
		const rawAddress = getNative('Адрес доставки');
		if (!rawAddress) return;

		const formattedAddress = formatAddress(rawAddress);
		const clickableAddress = makeAddressClickable(formattedAddress);
		const finalAddress = formatMetro(clickableAddress);

		td('Адрес доставки')
			.children('.native')
			.html(finalAddress)
			.find('.yadres')
			.on('click', handleAddressClick);

		//Форматирует исходный адрес, удаляя лишние пробелы и ненужные части
		function formatAddress(address) {
			return address
				.replace(/\s{2,}/, '') // удаляем дублирующиеся пробелы
				.replace(/(Москва город, |г\. Москва, )/, '') // убираем москву
				.replace(/^\d+,\s/, ''); // удаляем индекс
		}

		//Делает часть адреса (город, улица, дом) кликабельной
		function makeAddressClickable(address) {
			const parts = adres.parts.map(i => i[0]).join('|');
			const pattern = `(^.*(?:${parts})\\.\\s(?:[^,])+,\\sд\\.\\s(?:[^,])+(?:,\\s(?:корп\\.|стр\\.)\\s[^,]+)*)`;
			const addressRegex = new RegExp(pattern);
			return address.replace(addressRegex, '<a class="yadres">$1</a>');
		}

		//Форматирует отображение метро в адресе
		function formatMetro(address) {
			return address.replace(/(.+)(?:,\sметро\s(.+))/, 'м. $2<br>$1');
		}

		//Обработчик клика по адресу - копирует адрес в буфер обмена
		function handleAddressClick(e) {
			e.preventDefault();
			e.stopPropagation();
			ctrlc($(e.target).text());
		}
	}

	/**
	 * добавляем copyBtn с информацией о заказе клиенту
	 */
	function clientMsg() {
		const templates = {
			'2steblya':
				`📦 зоказек \*\*#{{orderId}}\*\* принят! проверь!

📅 \*\*доставка\*\*:
{{date}} {{time}} (именно в интервале! в какое точно время - босх его знает, курьер поедет по маршруту)

🏠 \*\*по адресу\*\*:
{{adres}}

{{poluchatel}}

⚠️ ну и эта - фот очки на праздники не присылаем
(тупо нет на это времени - колошматим как не в себя!)

💋 чмоки! пасиба за зоказек!`,
			'2steblya_white':
				`твой заказ \*\*#{{orderId}}\*\* принят! проверь!

\*\*доставка\*\*\:
{{date}} {{time}} (именно в интервале! в какое точно время - сказать не можем, курьер поедет по маршруту)

\*\*по адресу\*\*:
{{adres}}

{{poluchatel}}

фотографии на праздники не присылаем (к сожалению, на это нет времени)

спасибо за заказ!`
		}
		templates.gvozdisco = templates['2steblya'];

		const shop = shops.find(s => s.shop_title === getNative('Магазин'));
		if (!shop || !(shop.shop_crm_code in templates)) return;

		const template = templates[shop.shop_crm_code];
		const data = {
			orderId: String(order.id),
			date: get('Дата доставки'),
			time: get('Время доставки'),
			adres: getNative('Адрес доставки'),
			phone: get('Телефон получателя'),
			name: get('Имя получателя')
		}
		data.poluchatel = data.phone ? `🙎 \*\*получатель\*\*:\n${data.name ? data.name + ' / ' : ''}${data.phone}` : '';

		const output = template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || '');
		copyBtn(output).appendTo(td('Покупатель'));
	}

	/**
	 * выполняет внутренние функции по оптимизации ячейки "Курьер"
	 * порядок выполнения вложенных функций важен
	 */
	function courier() {
		auto();
		if (isSamovyvoz()) return;
		if (isDone()) return;
		price();
		orderInfo();
		svodka();
		warning();
		notifyIndicator();

		/**
		 * прооверяет тип доставки (самовывоз или курьер)
		 */
		function isSamovyvoz() {
			if (get('Тип доставки') == 'Самовывоз') {
				td('Курьер').children('.native').text('Самовывоз');
				return true;
			}
			return false;
		}

		/**
		 * проверяет, является ли заказ выполненным
		 */
		function isDone() {
			return (['Витрина', 'Разобран', 'Отменен'].includes(get('Статус заказа')));
		}

		/**
		 * сумма оплаты курьеру
		 */
		function price() {
			td('Курьер').append(`<div class="price">${get('Себестоимость доставки') || ''}</div>`);
		}

		/**
		 * индикатор доставки только на авто
		 */
		function auto() {
			if (!get('Автокурьер')) return;
			td('Курьер').prepend(`${iconsSVG.auto_courier}<br>`);
		}

		/**
		 * добавляет кликабельные кнопки для помещения в буфер сводки о заказе для курьера
		 */
		function orderInfo() {
			// данные для поиска курьера
			if (get('Адрес доставки')) {
				const $copyBtn = copyBtn(getData(false));
				$copyBtn.appendTo(td('Курьер'));
			}

			// полные данные для курьера
			td('Курьер').find('.native').replaceWith(() => $('<a/>', { 'class': 'native', 'href': '#', 'text': getNative('Курьер') }));
			td('Курьер').find('a.native').on('click', e => {
				e.preventDefault();
				e.stopPropagation();
				ctrlc(getData(true));
			});

			/**
			 * формирует своодку о заказе для курьера
			 * @param {bool} full - полные данные или урезанные
			 * @returns {string} - данные
			 */
			function getData(full = false) {
				const m = get('Дата доставки').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
				const deliveryDate = dates.create(new Date(m[3], m[2] - 1, m[1]));
				const auto = get('Автокурьер');
				const adres = getNative('Адрес доставки');
				const time = get('Время доставки');
				const price = get('Себестоимость доставки');
				const comment = get('Комментарий клиента');
				const phone = get('Телефон получателя');
				const name = get('Имя получателя');

				let output = '';
				if (deliveryDate.isToday || deliveryDate.daysTo <= 2) {
					output += `${deliveryDate.title} (${deliveryDate.strRu})`;
				} else {
					output += deliveryDate.strRu;
				}
				output += ` ${time}`;
				if (auto) output += `\nДоставка на своем автомобиле или на такси!`;
				if (adres) output += '\n' + (!full ? adres.replace(/(,\s(?:кв|эт|под)\..+$)/, '') : adres);
				if (full) {
					if (comment) output += ` ${comment}`;
					if (phone) output += `\n${phone}`;
					if (phone && name) output += ` / ${name}`;
				}
				if (price) output += `\n${price}`;

				return output;
			}
		}

		/**
		 * формирует данные для администратора о работе курьера по заказу
		 * будет использовано в генерации общей сводки в модуле orders_table
		 */
		function svodka() {
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
			td('Курьер').data('svodka', data);
		}

		/**
		 * добавляет индикатор, что курьер назначен, но данные ему еще не отправлены
		 */
		function notifyIndicator() {
			if (!needNotify()) return;

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

		/**
		 * проверяет, надо ли добавлять индикатор warning и добавляет его c тултипом
		 */
		function warning() {
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
				'курьер не уведомлен': needNotify() ? null : 'dont-need'
			}
			const nullItems = [];
			for (const [key, value] of Object.entries(data)) {
				if (!value) nullItems.push(key);
			}
			if (!nullItems.length) return;

			const $warnIcon = $(iconsSVG.warning);
			const $warnCont = td('Курьер').children('.warn');
			$warnCont.prepend($warnIcon);
			inlineTooltip($warnIcon, nullItems.join('<br>'));
		}

		/**
		 * проверяет, необходимо ли добавлять индикатор о том, что курьер не оповещен
		 */
		function needNotify() {
			const conditions = [
				['Выполнен', 'Разобран'].includes(get('Статус заказа')), //завершеные заказы
				fakeClients.includes(get('Покупатель')), //не настоящий клиент
				!!get('Букеты в заказе')?.match(/ДОНАТОШНАЯ/), //донат
				!order.delivery.data.id, //курьер не назначен
				order.customFields.courier_notified //курьер уведомлен
			];
			return !conditions.includes(true);
		}
	}

	function gamma() {
		const relevantKeys = ['gamma', 'viebri-tsvet', 'tsvet', 'viebri-gammu'];

		const values = order.items
			.flatMap(i => relevantKeys
				.map(key => i.properties?.[key]?.value)
				.filter(Boolean)
			);

		if (!values.length) return;

		const gammaText = values.join(', ');
		const gammaClasses = [
			{ regex: /ярк/i, className: 'bright' },
			{ regex: /нежн/i, className: 'soft' },
			{ regex: /т[её]мн/i, className: 'dark' },
			{ regex: /солнечн/i, className: 'sunny' },
			{ regex: /светл/i, className: 'light' }
		];
		const gammaClass = gammaClasses.find(({ regex }) => regex.test(gammaText))?.className || '';
		td('Букеты в заказе').prepend(`<div class="gamma ${gammaClass}">${gammaText}</div><br>`);
	}


	/**
	 * формирует состав букетов (только цветки) и добавляет их в тултип и буфер (по клику на copyBtn)
	 */
	function sostav() {
		const sostav = get('Состав');
		if (!sostav) return;

		//товары в составе
		const nativeProduts = getNative('Букеты в заказе');
		const products = [];
		if (nativeProduts) {
			nativeProduts.split('т),').forEach(product => {
				product = product.replace(/\(\d+\sш.*$/, ''); //удаляем штуки
				product = product.replace(/\s*\(.*\)/, ''); //убираем все в скобочках
				product = product.replace(/\s-\s.*$/, ''); //убираем все после дефиса
				product = product.trim();
				products.push(product);
			});
		}

		//цветы в составе
		const flowers = [];
		sostav.replaceAll(/шт\./g, 'шт.*separator*').split('*separator*').forEach(item => {
			item = item.trim();
			if (!item) return;
			item = item.replace(/\s*—.*$/, ''); //убираем все после навзания цветка
			item = item.replace(/\sодн|\sкуст/, ''); //убираем одн и куст (роза одн)
			item = item.replace(/\s-\s.*$/, ''); //убираем все после дефиса
			item = item.replace(/\s\d*$/, ''); //убираем цену			
			if (noFlowers.includes(item) || products.includes(item)) return;
			flowers.push(item.toLowerCase());
		});
		if (!flowers.length) return;
		const flowersString = Array.from(new Set(flowers)).sort().join(', '); //сортируем по алфавиту и удаляем дубликаты + формируем строку

		//copyBtn
		const $copyBtn = copyBtn(flowersString);
		$copyBtn.appendTo(td('Букеты в заказе'));
		inlineTooltip($copyBtn, flowersString);
	}

	/**
	 * добавляет тултип и copyBtn для текста в карточку от клиента
	 */
	function customCardText() {
		const text = get('Текст в карточку');
		if (!text) return;
		const $td = td('Выебри карточку');
		if (!get('Выебри карточку')) $td.children('.native').text('со своим текстом');
		if (get('Выебри карточку') != 'со своим текстом') $td.addClass('addComment customCardText');
		const $copyBtn = copyBtn(text);
		$copyBtn.appendTo($td);
		inlineTooltip($copyBtn, text);
	}

	/**
	 * добавляет кнопку-ссылку на менеджер печати карточек 
	 */
	async function printCard() {
		if (!get('Выебри карточку')) return;
		if (!order || !sku) return;
		if (!sku) return;
		$(`<a class="print_card" href="https://php.2steblya.ru/print_card?order_id=${orderId}&sku=${sku}&shop_crm_id=${shopDb?.shop_crm_id}" target="_blank">⎙</a>`).appendTo(td('Выебри карточку'));
	}

	/**
	 * добавляет индикатор warning для флориста
	 */
	function warningFlorist() {
		if (!get('Пометить для флориста и/или администратора')) return;
		const $warnCont = td('Чат').children('.warn');
		const $warnIcon = $(iconsSVG.warning);
		$warnCont?.prepend($warnIcon);
	}




	// функции, использующиеся неоднократно в исполняющих функциях

	/**
	 * создает copyBtn
	 * 
	 * @param {string} str - текст, помещаемый в буфер
	 * @returns {jquery}
	 */
	function copyBtn(str) {
		const $btn = $('<a class="copyBtn"></a>');
		$btn.on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			ctrlc(str);
		});
		return $btn;
	}

	/**
	 * превращает объект в триггер, при наведении на который появляется тултип
	 * использую css и js самой retailcrm
	 * 
	 * @param {jquery} $trigger - объект, к которому добавляется тултип 
	 * @param {string} text - содердимое тултипа
	 */
	function inlineTooltip($trigger, text) {
		$trigger.addClass('inline-tooltip-trigger');
		$trigger.after(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip">${text}</div>`);
	}




	// базовые функции обращения к ячейкам и их данным

	function td(title) {
		return $tr.children('td').eq(indexes[title.toLowerCase()]);
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
		const excludedValues = ['—', 'Нет', '0 ₽', ''];
		return excludedValues.includes(content) ? null : content;
	}
}