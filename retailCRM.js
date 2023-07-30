console.log('User Javascript Enabled');

var today = new Date();
var noFlowers = [
	'Транспортировочное', 'Упаковка', 'Декор', 'Оазис', 'Основа', 'Поддон', 'Яйцо', 'Свеча', 'Секатор', 'Игрушка', // разное
	'Ящик', 'Сердце', 'Кастрюля', 'Корзина', 'Горшок', 'Коробка' //ёмкости
];
var streetPercs = [
	['ул', 'улица'],
	['наб', 'набережная'],
	['бул', 'бульвар'],
	['ш', 'шоссе'],
	['пр-кт', 'проспект'],
	['пр-д', 'проезд'],
	['пер', 'переулок'],
	['пл', 'площадь'],
	['алл', 'аллея']
];

/* улучшаем страницы */
setInterval(function () {
	if ($('#main.modified').length) return;
	$('#main').addClass('modified');
	orderPage();
	ordersPage();
	productPage();
	courierPage();
}, 50);
leftMenu();
hiddenFinance();

/* игнорировать страницы, для которых еще не написан custom JS */
function pageHasCustomJs(page) {
	var pages = {
		orders: 'orders/$',
		order: 'orders/\\d+',
		order_new: 'orders/add',
		product: 'products/\\d+',
		courier: 'admin/couriers/\\d+'
	};
	if (!pages[page]) return false;
	return new RegExp(pages[page]).test(window.location.pathname);
}

/********************
ORDER
страница заказа
*********************/
function orderPage() {
	if (!pageHasCustomJs('order') && !pageHasCustomJs('order_new')) return;

	var tovarsTable;
	var tovars;
	var magazin;
	var site;

	var int = setInterval(function () {
		tovarsTable = $('#order-products-table');
		if (!tovarsTable.length) return;

		tovars = getTovars();
		magazin = getMagazin();
		site = getSite();

		orderCommentFieldsRename();
		orderDeliveryIntervalEditable();
		orderRemoveZipcode();
		orderYadres();
		orderAdresStreetDisclaimer();
		orderClearAdressNewOrder();
		orderAutoCourier();
		orderCourierPriceLabel();
		orderMagazinLogoInHeader();
		orderCardAndBuketCustomFields();
		orderTovarsASC();
		orderIgnoreDiscont();
		orderZakazchikPoluchatel();
		orderMessengerIcons();
		orderShopPopup();
		orderTovarPercsPopup();
		orderOstatkiOrderPriceASC();
		orderAdresDescription();
		orderAddTransport();
		orderCustomFieldsToRight();
		orderDiscount();
		orderFloristField();
		orderFlowersRashod();
		orderAvailableInventories();

		setInterval(function () {
			tovars = getTovars();
		}, 2000);

		clearInterval(int);
	}, 50);

	/* комментари клиенту и флористу */
	function orderCommentFieldsRename() {
		//заголовки
		$('#order-customer-comment .collapse-section__title').text('Комментарий для курьера');
		$('#order-manager-comment .collapse-section__title').text('Комментарий для флориста');
		//поля
		var courier = $('#intaro_crmbundle_ordertype_customerComment');
		if (!courier.val().includes('***курьер***')) return;
		var florist = $('#intaro_crmbundle_ordertype_managerComment');
		var text = courier.val().split(/\*{3}.+\*{3}/);
		$.each(text, function (i) {
			text[i] = text[i].replace(/^\n/, '').replace(/\n$/, '');
		});
		courier.val(text[1]);
		florist.val(text[2]);
	}
	/* интервал времени делаем редактируемым */
	function orderDeliveryIntervalEditable() {
		setInterval(function () {
			var inputs = $('#intaro_crmbundle_ordertype_deliveryTime_from,#intaro_crmbundle_ordertype_deliveryTime_to');
			if (!inputs.length) return;
			inputs.removeAttr('readonly');
		}, 1000);
	}
	/* удалить индекс */
	function orderRemoveZipcode() {
		var int = setInterval(function () {
			var input = $('#intaro_crmbundle_ordertype_deliveryAddress_index');
			if (!input.val()) return;
			input.val('');
			clearInterval(int);
		}, 2000);
	}
	/* скопировать адрес для яндекса */
	function orderYadres() {
		var id = '#intaro_crmbundle_ordertype_deliveryAddress_';
		var a = {
			city: $(id + 'city').val() ? 'г. ' + $(id + 'city').val().replace(/^г\.\s/, '') + ', ' : '',
			street: $(id + 'street').val() ? $(id + 'street').val() : '',
			dom: $(id + 'building').val() ? ', д. ' + $(id + 'building').val() : '',
			corp: $(id + 'housing').val() ? ', корп. ' + $(id + 'housing').val() : '',
			str: $(id + 'house').val() ? ', стр. ' + $(id + 'house').val() : '',
			kv: $(id + 'flat').val() ? ', кв./офис ' + $(id + 'flat').val() : '',
			podezd: $(id + 'block').val() ? ', подъезд ' + $(id + 'block').val() : '',
			etag: $(id + 'floor').val() ? ', этаж ' + $(id + 'floor').val() : ''
		}
		if (a['city'] == 'г. Москва') a['city'] = '';
		if (!a['street'] || !a['dom']) return;
		appendAdresBtn('адрес целиком', '', Object.values(a).join(''));
		appendAdresBtn('улица/дом', 'yadres', a['city'] + a['street'] + a['dom'] + a['corp'] + a['str']);

		function appendAdresBtn(title, className, adres) {
			var btn = $('<a class="adresCopyBtn ' + className + '">❐ ' + title + '</a>');
			btn.on('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				ctrlC(adres);
			});
			$('#order-delivery .collapse-section__title').append(btn);
		}
	}
	/* примечание по улицам */
	function orderAdresStreetDisclaimer() {
		var disclaimerPercs = [];
		for (var i = 0; i < streetPercs.length; i++) {
			disclaimerPercs.push('<b>' + streetPercs[i][0] + '</b> (<small>' + streetPercs[i][1] + '</small>)');
		}
		var disclaimer = $('<div id="streetDisclaimer" class="input-group cleared control-after" style="max-width:280px"><p>Чтобы в таблице адрес стал кликабельным, соблюдай шаблон:</p><p>' + disclaimerPercs.join(', ') + '<br> + точка + пробел + название</p><p>Например: ул. Тверская, ш. Энтузиастов</p></div>');
		disclaimer.insertBefore('.address-form');
	}
	/* очищаем поля адреса, когда создается заказ вручную */
	function orderClearAdressNewOrder() {
		if (!pageHasCustomJs('order_new')) return;
		var name = $('#intaro_crmbundle_ordertype_firstName');
		var adresFields = [
			$('#intaro_crmbundle_ordertype_deliveryAddress_street'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_streetId'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_region'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_regionId'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_city'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_cityId'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_metro'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_building'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_flat'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_house'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_block'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_floor'),
			$('#intaro_crmbundle_ordertype_deliveryAddress_housing')
		];
		var int = setInterval(function () {
			if (!name.val()) return;
			clearInterval(int);
			var int2 = setInterval(function () {
				if (!adresFields[0].val()) return;
				if (!adresFields[0].is('.important-auto-data')) return;
				$.each(adresFields, function (i, adresField) {
					adresField.val('').removeClass('important-auto-data');
				});
				clearInterval(int2);
			}, 100);
		}, 100);
	}
	/* автокурьер */
	function orderAutoCourier() {
		if (site != '2STEBLYA') return;
		var autoFormats = ['коробка', 'корзинка', 'корзина', 'букет-гигант', 'корзинища'];
		tovars.each(function () {
			var tr = $(this);
			if (!isBuket(tr)) return;
			var props = tr.find('.order-product-properties > span');
			props.each(function () {
				var p = $(this).attr('title').split(': ');
				if (p[0] != 'фор мат') return;
				if (!autoFormats.includes(p[1])) return;
				$('#intaro_crmbundle_ordertype_customFields_auto_courier').prop('checked', true);
				return false;
			});
		});
	}
	/* себестоимость доставки переименовать в "Стоимость для курьера" */
	function orderCourierPriceLabel() {
		$('label[for="intaro_crmbundle_ordertype_deliveryNetCost"]').text('Стоимость для курьера');
	}
	/* лого магазина в шапке */
	function orderMagazinLogoInHeader() {
		var size = 38;
		var icon = getMagazinIcon(magazin);
		var logo = $('<div class="head__col" style="padding-right:5px;border-right:0 none"><img src="' + icon + '" width="' + size + '" height="' + size + '"></div>');
		$('.status.head__col').before(logo);
	}
	/* букет и карточка */
	function orderCardAndBuketCustomFields() {
		var buckets = [];
		var cards = [];
		tovars.each(function () {
			var tr = $(this);
			if (!isBuket(tr)) return true;
			var title = tr.find('.title .tr-link').text();
			if (site == '2STEBLYA') {
				var descr = [];
				var format = '';
				var props = tr.find('.order-product-properties > span');
				$(props.get().reverse()).each(function () {
					var p = $(this).attr('title').split(': ');
					switch (p[0]) {
						case 'цена':
						case 'артикул':
							break;
						case 'выебри карточку':
							cards.push(p[1]);
							break;
						case 'фор мат':
							/* должен быть последним всегда, так как из тильды "фор мат" всегда улетает первым,
							а ранее мы сделали reverse() для props */
							format = p[1];
							break;
						default:
							if (p[0].startsWith('накинуть')) break;
							descr.push(p[0] + ': ' + p[1]);
							break;
					}
				});
				title = title.replace(/\s-\s.+/, '') + ' ';
				title += descr.length ? '(' + descr.join(', ') + ') ' : '';
				title += format ? '- ' + format + ' ' : '';
			} else {
				title += ' ';
			}
			var amount = tr.find('.quantity input').val();
			amount = parseInt(amount, 10);
			buckets.push(title + '(' + amount + ' шт)');
		});
		var fieldBucket = $('#intaro_crmbundle_ordertype_customFields_bukety_v_zakaze');
		var fieldCard = $('#intaro_crmbundle_ordertype_customFields_card');
		if (fieldBucket.val() != buckets.join(', ')) fieldBucket.val(buckets.join(', '));
		if (fieldCard.val() != cards.join(', ')) fieldCard.val(cards.join(', '));
	}
	/* товары по алфавиту */
	function orderTovarsASC() {
		var tovarsLength;
		tovarsLength = tovars.length;
		sortRows();
		setInterval(function () {
			if (tovars.length == tovarsLength) return;
			tovarsLength = tovars.length;
			sortRows();
		}, 50);
		/* меняем порядок товаров по алфавиту */
		function sortRows() {
			tovars.sort(function (a, b) {
				var keyA = $(a).find('.title a').text();
				var keyB = $(b).find('.title a').text();
				//товары с числителями
				var keyAtitle = keyA.replace(/\s\d+/, '');
				var keyAnum = keyA.replace(/[^\d]+/, '');
				var keyBtitle = keyB.replace(/\s\d+/, '');
				var keyBnum = keyB.replace(/[^\d]+/, '');
				if (keyAnum && keyBnum && keyAtitle == keyBtitle) {
					if (parseInt(keyAnum) < parseInt(keyBnum)) return -1;
					if (parseInt(keyAnum) > parseInt(keyBnum)) return 1;
				}
				//прочие товары
				if (keyA < keyB) return -1;
				if (keyA > keyB) return 1;
				return 0;
			});
			tovars.each(function (i, row) {
				if (isBuket($(row))) return true;
				$(row).appendTo($(row).parent());
			});
		}
	}
	/* чекбокс игнорировать триггер скидки */
	function orderIgnoreDiscont() {
		var inputMain = $('#intaro_crmbundle_ordertype_customFields_discount_trigger_ignore');
		var inputClone = $('<input type="checkbox" class="input-field" />');
		var inputCloneBlock = $('<div class="order-row__top" style="margin-top:8px"><span style="margin-right:10px">Игнорировать триггер скидки</span></div>');
		inputCloneBlock.insertBefore('#patch-order-discount-errors').append(inputClone);
		inputClone.prop('checked', inputMain.prop('checked'));
		inputClone.on('change', function () {
			inputMain.prop('checked', inputClone.prop('checked'));
		});
		inputMain.parent().hide();
	}
	/* заказчик-получатель */
	function orderZakazchikPoluchatel() {
		var input = $('#intaro_crmbundle_ordertype_customFields_zakazchil_poluchatel');
		var name = $('#intaro_crmbundle_ordertype_customFields_name_poluchatelya');
		var phone = $('#intaro_crmbundle_ordertype_customFields_phone_poluchatelya');
		input.on('change', function () {
			switch (input.prop('checked')) {
				case true:
					name.val($('#intaro_crmbundle_ordertype_firstName').val());
					phone.val($('#intaro_crmbundle_ordertype_phone').val());
					break;
				case false:
					name.val('');
					phone.val('');
					break;
			}
		});
	}
	/* мессенджер заказчика */
	function orderMessengerIcons() {
		var field = $('#intaro_crmbundle_ordertype_customFields_messenger_zakazchika');
		var iconSize = 18;
		var icons = getMessengerIcons(iconSize);
		$.each(icons, function (i, e) {
			var btn = $('<div class="messengerIcon">' + icons[i] + '</a>');
			if (field.val().startsWith('@')) return;
			btn.insertAfter(field);
			btn.on('click', function () {
				field.val(i);
			});
		});
	}
	/* окно набора товаров в заказ */
	function orderShopPopup() {
		$('#add-order-product-btn').on('click', function () {
			$('#CRMBundle_AddOrderProductPopupFilter_Type_site').val(4).change(); //магазин "остатки"
			$('#CRMBundle_AddOrderProductPopupFilter_Type_mixNameProduct').nextAll('button[name="search"]').trigger('click');
			buketsZeroPrice();
			popupTitle();
		});
		/* обнуляем стоимость букетов */
		function buketsZeroPrice() {
			tovars.each(function () {
				if (!isBuket($(this))) return true;
				var inputs = $(this).find('input[id$="initialPrice"],[id$="order-price-dropdown"] .order-price__main input');
				inputs.val(0).change();
			});
		}
		/* добавляем в заголовок данные о деньгах */
		function popupTitle(tovars) {
			var title = $('<span class="popupTitle"></span>');
			var initialTitleText = 'Добавление товаров';
			var h2 = $('.popup-with-item-list h2');
			h2.get(0).childNodes[0].remove();
			h2.prepend(title);
			var int = setInterval(function () {
				title.html('Счет' + popupTitleConstructor());
			}, 1000);
			//очищаем заголовок
			$('body').on('click', '#order-product-popup .close, .popup-closer-overlay', function () {
				title.html(initialTitleText);
				clearInterval(int);
			});
		}
		/* строим строку для заголовка */
		function popupTitleConstructor() {
			var text = '';
			var money = getMoney();
			text += money['tovars'];
			if (money['total']) text += ' <small>из</small> ' + (money['total'] - money['delivery']);
			if (money['delivery']) text += ' + <small>доставка:</small> ' + money['delivery'];
			if (money['delivery']) {
				text += ' = ' + (money['tovars'] + money['delivery']);
				if (money['total']) text += ' <small>из</small> ' + money['total'];
			}
			if (text) text = ': ' + text + ' ₽';
			if (money['payed']) text += ' <small>(оплачено)</small>';
			text += ' (<b>' + (money['total'] - money['current'] == 0 ? 'ok' : (money['total'] - money['current']) + ' ₽') + '</b>)';
			return text;
		}
	}
	/* окно добавления свойств в товар */
	function orderTovarPercsPopup() {
		var popup, field, name, value, selects, nameSelect, valueSelect;
		var names = {
			'фор мат': ['букетусик', 'букетик', 'букет', 'букетище', 'коробка', 'сердечко', 'сердце', 'кастрюлька', 'кастрюля', 'кастрюлища', 'корзинка', 'корзина', 'корзинища', 'горшочек', 'горшок'],
			'выебри карточку': ['с нашей карточкой', 'со своим текстом', 'без карточки', 'без айдентики'],
			'цена': [5000, 6000, 10000, 15000, 20000, 25000, 35000, 50000]
		};
		var codes = {
			'фор мат': 'for-mat',
			'выебри карточку': 'viebri-kartochku',
			'цена': 'tsena'
		};
		nameSelect = $('<select style="margin-left:10px"><option></option></select>');
		valueSelect = nameSelect.clone();
		$.each(names, function (i) {
			nameSelect.append('<option value="' + i + '">' + i + '</option>');
		});
		selects = $('<div style="position:absolute;top:5px;right:5px">Быстрый выбор: </div>');
		selects.append(nameSelect).append(valueSelect);
		function appendOptionsToValueSelect(value) {
			valueSelect.empty();
			valueSelect.append('<option></option>');
			$.each(names[nameSelect.val()], function (i, j) {
				valueSelect.append('<option value="' + j + '">' + j + '</option>');
			});
		}
		var fieldSelected = null;
		var int = setInterval(function () {
			popup = $('#order-product-properties');
			if (!popup.length) return;
			if (!popup.is(':visible')) return;
			field = popup.find('.field-settings:visible');
			if (!field.length) return;
			if (fieldSelected == field.data('index')) return;
			fieldSelected = field.data('index');
			field.append(selects);
			//code
			var code = field.find('.property-field-code');
			code = code.length ? code.children('span').text().trim() : 'new';
			//name
			name = field.find('.property-field-name input');
			nameSelect.val(name.val());
			nameSelect.prop('disabled', codes[name.val()] == code);
			nameSelect.on('change', function () {
				name.val(nameSelect.val());
				appendOptionsToValueSelect();
				value.val('');
				name.change();
				value.change();
			});
			//value
			value = field.find('.property-field-value input');
			appendOptionsToValueSelect();
			valueSelect.val(value.val());
			valueSelect.on('change', function () {
				value.val(valueSelect.val());
				value.change();
			});
		}, 1000);
		$('body').on('click', '#order-product-properties .close, #order-product-properties .save-button, .popup-closer-overlay', function () {
			clearInterval(int);
			fieldSelected = null;
		});
	}
	/* торговые предложения по порядку по цене */
	function orderOstatkiOrderPriceASC() {
		$('body').on('click', '#order-list #order-product-popup tr.has-children', function () {
			var tr = $(this);
			var productId = tr.data('product-id');
			var int = setInterval(function () {
				var children = tr.siblings('.is-child[data-product-id="' + productId + '"][data-price]').get();
				if (!children.length) return;
				children.sort(function (a, b) {
					var keyA = parseInt($(a).data('price').replace(/\.\d+/, ''));
					var keyB = parseInt($(b).data('price').replace(/\.\d+/, ''));
					if (keyA < keyB) return 1;
					if (keyA > keyB) return -1;
					return 0;
				});
				$.each(children, function (i, row) {
					tr.next().after(row);
				});
				clearInterval(int);
			}, 50);

		});
	}
	/* описание для дефолтного адреса */
	function orderAdresDescription() {
		$('label[for="intaro_crmbundle_ordertype_deliveryAddress_text"]').html('Адрес<br><span style="font-size:.8em;line-height:.6em">это поле используется только для определения станции метро. Для того, чтобы адрес доставки отображался в общей таблице и был доступен для отправки курьерам, используй поле "Адрес доставки" ниже</span>');
	}
	/* добавляем транспортировочное автоматически */
	function orderAddTransport() {
		var transportByMagazin = {
			'2STEBLYA': 'Транспортировочное',
			'STAY TRUE Flowers': 'Транспортировочное'
		}
		var deliveryPrice = $('#custom-field-stoimost_dostavki_iz_tildy').text() ? parseInt($('#custom-field-stoimost_dostavki_iz_tildy').text().trim()) : 500;
		searchTransport();
		$('#intaro_crmbundle_ordertype_site').on('change', function () {
			searchTransport();
		});
		/* проверяем магазин и наличие транспортировочного */
		function searchTransport() {
			magazin = getMagazin();
			if (!Object.keys(transportByMagazin).includes(magazin)) return;
			var dont = false;
			tovars.each(function () {
				var title = $(this).find('.title .tr-link').text();
				if (/ДОНАТОШНАЯ/.test(title)) {
					dont = true;
					return;
				}
				if (title != transportByMagazin[magazin]) return;
				dont = true;
				return false;
			});
			if (!dont) addTransport();
		}
		/* добавляем транспортировочное */
		function addTransport() {
			$('#add-order-product-btn').trigger('click');
			var exist = false;
			var int = setInterval(function () {
				var popup = $('#order-product-popup');
				if (!popup.length) return;
				popup.hide();
				$('#CRMBundle_AddOrderProductPopupFilter_Type_site').val(4).change(); //магазин "остатки"
				$('#CRMBundle_AddOrderProductPopupFilter_Type_mixNameProduct').nextAll('button[name="search"]').trigger('click');
				setTimeout(function () {
					var rows = popup.find('.modern-table_product tr');
					if (!rows.length) return;
					rows.each(function () {
						if ($(this).children('td').eq(1).text().trim() == transportByMagazin[magazin]) {
							exist = true;
							//if (magazin == 'STAY TRUE Flowers') $(this).find('.product-count__area').val(2); //две упаковки для STF
							$(this).trigger('click');
							popup.find('.close').trigger('click');
							return false;
						}
					});
					if (!exist) {
						rows.last().find('a').trigger('click');
						return;
					}
					decriseTovarPrice();
					setDeliveryPrice();
					clearInterval(int);
				}, 1000);
			}, 50);
		}
		/* уменьшаем стоимость букета на стоимость транспортировочного */
		function decriseTovarPrice() {
			tovars.each(function () {
				if (!isBuket($(this))) return true;
				var inputTd = $(this).find('td.price');
				var input = inputTd.find('.order-price__main .order-value-input');
				var price = parseInt($(this).find('.order-product-properties span[title^="цена"]').text().replace(/[^\d]/g, ''));
				var decrease = {
					/* на сколько / сколько раз */
					'2STEBLYA': [500, 1],
					'STAY TRUE Flowers': [500, 1]
				};
				inputTd.find('.order-price__value').trigger('click');
				input.val(price - decrease[magazin][0] * decrease[magazin][1] - deliveryPrice);
				inputTd.find('.order-price__button_submit').trigger('click');
				return false;
			});
		}
		/* стоимость доставки */
		function setDeliveryPrice() {
			$('#delivery-cost').val(deliveryPrice);
			$('.order-delivery-cost__value-static').eq(0).html(' ' + deliveryPrice + '<span class="currency-symbol rub">₽</span>');
		}
	}
	/* скидка для STF */
	function orderDiscount() {
		if (magazin != 'STAY TRUE Flowers') return;
		if ($('#intaro_crmbundle_ordertype_status + div').get(0).innerText == 'Выполнен') return;
		if (!$('.order-status .os-vip').is('.os-select')) return;
		if ($('#intaro_crmbundle_ordertype_customFields_discount_trigger_ignore').is(':checked')) return;
		var totalField = $('#custom-field-summa_zakazov');
		if (!totalField.length) return;
		var zakazAmount = parseInt($('[title="Количество заказов, оформленных данным покупателем"]').text().trim().match(/(?:\d+) всего/));
		if (zakazAmount <= 1) return;
		var total = parseInt(totalField.text().trim());
		if (!total) return;
		var discount = 0;
		if (total < 25000) discount = 5;
		if (total >= 25000 && total < 50000) discount = 7;
		if (total >= 50000 && total < 100000) discount = 10;
		if (total >= 100000) discount = 15;
		$('#intaro_crmbundle_ordertype_discountManualPercent').val(discount).change();
	}
	/* переносим кастомные поля вправо */
	function orderCustomFieldsToRight() {
		$('#order-custom-fields').addClass('toRight').removeClass('ft-lt m-box__left-side').insertAfter($('.m-box__right-side > div:last')).wrap('<div />');
	}
	/* флорист в основное */
	function orderFloristField() {
		var florist = $('#intaro_crmbundle_ordertype_customFields_florist');
		var floristParent = florist.parent();
		var manager = $('#intaro_crmbundle_ordertype_manager').parent();
		florist.insertAfter(floristParent);
		manager.hide().after(floristParent);
	}
	/* доступные остатки */
	function orderAvailableInventories() {
		setInterval(function () {
			$('#order-list [data-available-quantity]').each(function () {
				if (parseInt($(this).attr('data-available-quantity')) < 999) return;
				$(this).parent().hide();
			});
		}, 1000);
	}
	/* расходы на закуп цветка */
	function orderFlowersRashod() {
		var flowersRashodBlock = $('<li class="order-table-footer__list-item"><p class="order-table-footer__text order-table-footer__text_muted order-table-footer__text_full">Стоимость закупа (цветок / упак)</p><p class="order-table-footer__text order-table-footer__text_price"><span id="flowersRashodValue"></span>&nbsp;<span class="currency-symbol rub">₽</span> / <span id="noflowersRashodValue"></span>&nbsp;<span class="currency-symbol rub">₽</span></p></li>');
		flowersRashodBlock.prependTo('#order-list .order-table-footer__list');
		var flowersRashodField = $('#intaro_crmbundle_ordertype_customFields_flower_rashod');
		var flowersRashodFieldOldValue = flowersRashodField.val();
		var noflowersRashodField = $('#intaro_crmbundle_ordertype_customFields_noflower_rashod');
		var noflowersRashodFieldOldValue = noflowersRashodField.val();
		flowersRashodField.parent().hide();
		noflowersRashodField.parent().hide();
		rashodCalc();
		/* пересчитываем стоимость, если менялись данные полей */
		$("#order-products-table input").on('change', function () {
			rashodCalc();
		});
		/* пересчитываем стоимость, если меняется количество товаров */
		var tovarsAmountOld = 0;
		setInterval(function () {
			var tovarsAmountNew = tovars.length;
			if (tovarsAmountOld == tovarsAmountNew) return;
			tovarsAmountOld = tovarsAmountNew;
			rashodCalc();
		}, 1000);
		function rashodCalc() {
			var flowersPrice = 0;
			var noflowersPrice = 0;
			tovars.each(function () {
				var tovar = $(this);
				if (isBuket(tovar)) return;
				var amount = parseFloat(tovar.find('.quantity input').val().replace(',', '.'));
				var title = tovar.find('.title .tr-link').text().replace(/\s\d+/, '');
				/* считаем цены */
				var price = parseFloat(tovar.find('.wholesale-price__value').text().replace(/\s/, '').replace('₽', ''));
				if (noFlowers.includes(title)) {
					noflowersPrice += price * amount;
				} else {
					flowersPrice += price * amount;
				}
			});
			flowersPrice = flowersPrice.toFixed(0);
			noflowersPrice = noflowersPrice.toFixed(0);
			flowersRashodBlock.find('#flowersRashodValue').text(flowersPrice);
			flowersRashodBlock.find('#noflowersRashodValue').text(noflowersPrice);
			if (flowersRashodFieldOldValue != flowersPrice) flowersRashodField.val(flowersPrice);
			if (noflowersRashodFieldOldValue != noflowersPrice) noflowersRashodField.val(noflowersPrice);
		}
	}
	/* HELPERS */
	function getTovars() {
		return tovarsTable.find('tbody.product-group');
	}
	function getMagazin() {
		var block = $('#intaro_crmbundle_ordertype_site_chosen span');
		if (!block.length) return false;
		return block.text().trim();
	}
	function getSite() {
		var block = $('#intaro_crmbundle_ordertype_site_chosen .chosen-single span');
		if (!block.length) return false;
		return block.text().trim();
	}
	function isBuket(tovar) {
		if ($(tovar).find('.image img').length) return true;
		return false;
	}
	function getCurrentMoney() {
		return parseFloat($('#order-total-summ').text().replace(/[^\d,]/g, '').replace(',', '.'));
	}
	function getPayedMoney() {
		payed = 0;
		var pays = $('[id$="amount_text"][id^="intaro_crmbundle_ordertype_payments"]');
		pays.each(function () {
			var status = $(this).parents('.payment__content-wrapper').children('.input-group').eq(0).find('[id$="status_chosen"] a span').text();
			if (status != 'Оплачен') return;
			payed += parseFloat($(this).text().replace(/[^\d,]/g, '').replace(',', '.'));
		});
		return payed;
	}
	function getDeliveryMoney() {
		return parseFloat($('#delivery-cost').val());
	}
	function getTotalMoney() {
		var totalPrice = 0;
		/* если есть оплаты, пробуем оттолкнуться от них */
		totalPrice = getPayedMoney();
		/* если нет оплат, пробуем поискать поле "цена" у товара */
		if (!totalPrice) {
			if (tovars.length) {
				tovars.each(function () {
					if (!isBuket($(this))) return true;
					var props = $(this).find('.order-product-properties span.additional');
					if (!props) return;
					props.each(function (i, e) {
						var prop = $(this).attr('title').split(': ');
						if (prop[0] != 'цена') return;
						totalPrice += parseInt(parseInt(prop[1]));
					});
				});
			}
		}
		return totalPrice;
	}
	function getTovarsMoney() {
		return getCurrentMoney() - getDeliveryMoney();
	}
	function getMoney() {
		return {
			current: getCurrentMoney(),
			payed: getPayedMoney(),
			delivery: getDeliveryMoney(),
			tovars: getTovarsMoney(),
			total: getTotalMoney()
		};
	}
}

/********************
ORDERS
страница с заказами
*********************/
function ordersPage() {
	if (!pageHasCustomJs('orders')) return;

	var table;
	var trs;
	var ths;
	var indexes = {};
	var hiddenCols = [
		'Дата и время',
		'Тип доставки',
		'Телефон получателя',
		'Имя получателя',
		'Себестоимость доставки',
		'Аноним',
		'Текст в карточку',
		'Узнать адрес у получателя',
		'Номер',
		'Метро',
		'Сумма оплаты',
		'Телефон курьера',
		'Примечания курьера',
		'Автокурьер',
		'Расходы на закуп цветка',
		'Расходы на закуп нецветка',
		'Откуда узнал о нас (в заказе)',
		'Скидка в процентах',
		'Комментарий оператора',
		'Комментарий клиента',
		'Контактный телефон',
		'Состав',
		'Сумма по товарам'
	];

	var int = setInterval(function () {
		table = $('.js-order-list');
		if (!table.length) return;
		trs = getTrs();
		ths = getThs();

		ordersTdIndexes();
		ordersHideHiddenCols();
		ordersColoredRows();
		ordersComments();
		ordersOnanim();
		ordersMessenger();
		ordersVip();
		ordersId();
		ordersSummaOplata();
		ordersNoIdentic();
		ordersAdresOptimize();
		ordersMagazinLogos();
		ordersSpecialCharsInBuckets();
		ordersAutoCourier();
		ordersCopyCourier();
		ordersCopySostav();
		ordersCopyCustomText();
		ordersNotifyPoluchatel();
		ordersFilterDelivery();
		ordersFilterZakazDate();
		ordersFilterSpisanie();
		ordersFilterOtkudaUznal();
		ordersFilterNonProductiveOrders();
		ordersSvodkaCouriers();
		ordersSvodkaFlowersNoflowers();

		clearInterval(int);
	}, 50);

	/* собираем индексы всех столбцов, чтоб в дальнейшем обращаться к ним во внутренних функциях */
	function ordersTdIndexes() {
		ths.each(function () {
			var th = $(this);
			indexes[th.text().trim()] = th.index();
		});
	}
	/* скрываем ненужные столбцы */
	function ordersHideHiddenCols() {
		var style = $('<style />');
		$.each(hiddenCols, function (i, title) {
			var index = ths.eq(indexes[title]).index() + 1;
			style.append('.js-order-list tr th:nth-child(' + index + '),.js-order-list tr td:nth-child(' + index + '){display:none}');
		});
		style.appendTo('body');
	}
	/* подкрашиваем строки */
	function ordersColoredRows() {
		trs.each(function () {
			var tr = $(this);
			var color = null;
			if (getTdText(tr, 'Магазин') == 'STAY TRUE Flowers') color = 'fffaff';
			switch (getTdText(tr, 'Покупатель')) {
				case 'списание':
					color = 'fff3ee';
					tr.addClass('spisanie batchHide');
					break;
				case 'Наличие':
					color = 'e6fff1';
					tr.addClass('nalichie batchHide');
					break;
			}
			if (getTdText(tr, 'Букеты в заказе').match(/ДОНАТОШНАЯ/)) {
				color = 'ffffe9';
				tr.addClass('donat batchHide');
			}
			if (!color) return true;
			tr.children().css('background-color', '#' + color);
		});
	}
	/* комментарии */
	function ordersComments() {
		trs.each(function () {
			var tr = $(this);
			var texts = [];
			var courier = getTdText(tr, 'Комментарий клиента').replace(/\n/g, '<br>');		//курьер
			var florist = getTdText(tr, 'Комментарий оператора').replace(/\n/g, '<br>');		//флорист
			if (florist && florist != '—') {
				texts.push('<b>Флористу</b>:<br>' + florist);
			}
			if (courier && courier != '—') {
				texts.push('<b>Курьеру</b>:<br>' + courier);
			}
			var minWidth = 320;
			getTd(tr, 'Чат').html(texts.join('<br><br>')).css('min-width', minWidth + 'px');
			ths.eq(indexes['Чат']).text('Коммментарии').css('min-width', minWidth + 'px');
		});
	}
	/* онаним */
	function ordersOnanim() {
		trs.each(function () {
			var tr = $(this);
			if (getTdText(tr, 'Аноним') == 'Нет') return true;
			getTd(tr, 'Покупатель').addClass('orderComment zakazchikOnanim');
		});
	}
	/* месссенджер заказчика */
	function ordersMessenger() {
		var iconSize = 15;
		icons = getMessengerIcons(iconSize);
		trs.each(function () {
			var tr = $(this);
			var th = ths.eq(indexes['Мессенджер заказчика (в заказе)']);
			var tdMessenger = getTd(tr, 'Мессенджер заказчика (в заказе)');
			var tdMessengerСss = { 'width': '15px', 'padding-right': 0, 'padding-left': 0, 'text-align': 'right' }
			tdMessenger.css(tdMessengerСss);
			th.empty().css(tdMessengerСss);

			var tdClient = getTd(tr, 'Покупатель');
			var tdClientСss = { 'overflow': 'hidden' }
			tdClient.css(tdClientСss);
			ths.eq(indexes['Покупатель']).css(tdClientСss);

			var phone = getTdText(tr, 'Контактный телефон').replace(/^\+7|8/, '');
			var aPhone = $('<div class="copyPhone" style="font-size:.8em;opacity:.5;cursor:pointer"><a>' + phone + '</a></div>');
			aPhone.on('click', function (e) {
				e.preventDefault;
				e.stopPropagation();
				ctrlC(phone);
			});
			aPhone.appendTo(tdClient);

			var messengerText = getTdText(tr, 'Мессенджер заказчика (в заказе)');
			if (messengerText == '—') {
				tdMessenger.empty();
				return;
			}

			var messengerType = (!Object.keys(icons).includes(messengerText) ? 'Telegram' : messengerText);
			var messengerIcon = icons[messengerType];
			var tdMessenger = getTd(tr, 'Мессенджер заказчика (в заказе)');

			tdMessenger.html(messengerIcon);

			if (messengerType == 'Whatsapp') return;
			if (/^[Tt]elegram$/.test(messengerText)) return;
			if (!/^[a-zA-Z\d\-@_\.]+$/.test(messengerText)) return;
			if (!/[a-zA-Z]/.test(messengerText)) return;
			if (/^.+@/.test(messengerText)) return;
			if (messengerText[0] != '@') messengerText = '@' + messengerText;
			var aTelegram = $('<a href="https://t.me/' + messengerText.substring(1) + '" target="_blank" style="font-size:.9em;white-space:nowrap">' + messengerText.toLowerCase() + '</a>');
			aTelegram.appendTo(tdClient);
		});
	}
	/* vip */
	function ordersVip() {
		trs.each(function () {
			var tr = $(this);
			var importantFlag = getTd(tr, 'Номер').find('.important-flag');
			if (!importantFlag.length) return true;
			getTd(tr, 'Покупатель').append(importantFlag);
		});
	}
	/* номер заказа перед чекбоксом */
	function ordersId() {
		trs.each(function () {
			var tr = $(this);
			var id = getTd(tr, 'Номер').find('a');
			id.on('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				ctrlC(id.text());
			});
			tr.children('td:first').prepend('<br>').prepend(id);
		});
	}
	/* сумма и оплата */
	function ordersSummaOplata() {
		trs.each(function () {
			var tr = $(this);
			summaOplata(tr);
			skidka(tr);
		});
		function summaOplata(tr) {
			var summa = parseInt(getTdText(tr, 'Сумма').replace(/[^\d]/, ''));
			var oplata = getOplata(getTdText(tr, 'Сумма оплаты').replaceAll(/(\d)\s(\d)/g, '$1$2').match(/\d+/g));
			if (summa == oplata) return;
			$('<div style="font-size:.9em;opacity:.5">Оплачено:<br>' + oplata + '</div>').appendTo(getTd(tr, 'Сумма'));
		}
		function getOplata(oplatas) {
			var oplata = 0;
			if (!Array.isArray(oplatas)) return oplata;
			for (var i = 0; i < oplatas.length; i++) {
				oplata += parseInt(oplatas[i]);
			}
			return oplata;
		}
		function skidka(tr) {
			var skidkaAmount = getTdText(tr, 'Скидка в процентах');
			if (skidkaAmount == '—' || skidkaAmount == 0) return;
			$('<div style="position:absolute;top:0;right:0;font-size:10px;background:#ff7a93;color:#fff;line-height:15px;padding:0 4px">' + getTdText(tr, 'Скидка в процентах') + '%</div>').appendTo(getTd(tr, 'Сумма'));
		}
	}
	/* подсвечиваем "без айдентики" */
	function ordersNoIdentic() {
		trs.each(function () {
			var tr = $(this);
			if (getTdText(tr, 'Выебри карточку') != 'без айдентики') return;
			getTd(tr, 'Выебри карточку').contents().wrap('<span style="background:#f3ff92" />');
		});
	}
	/* переоформляем адрес доставки */
	function ordersAdresOptimize() {
		trs.each(function () {
			var tr = $(this);
			var td = getTd(tr, 'Адрес доставки');
			var adres = getTdText(tr, 'Адрес доставки');
			/* удаляем дублирующиеся пробелы */
			adres = adres.replace(/\s{2,}/, '');
			/* убираем москву */
			adres = adres.replace('Москва город, ', '');
			adres = adres.replace('г. Москва, ', '');
			/* удаляем индекс (у старых заказов) */
			adres = adres.replace(/^\d+,\s/, '');
			/* кликабельный адрес (город, улица, дом) */
			var streetPercsShort = [];
			for (var i = 0; i < streetPercs.length; i++) {
				streetPercsShort.push(streetPercs[i][0]);
			}
			var adresRegex = new RegExp('(^.*(?:' + streetPercsShort.join('|') + ')\\.\\s(?:[^,])+,\\sд\.\\s(?:[^,])+(?:,\\s(?:корп\\.|стр\\.)\\s[^,]+)*)');
			adres = adres.replace(adresRegex, '<a class="yadres">$1</a>');
			/* метро */
			adres = adres.replace(/(.+)(?:,\sметро\s(.+))/, 'м. $2<br>$1');
			td.html(adres);
		});
		$('.yadres').on('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			ctrlC($(this).text());
		});
	}
	/* лого магазинов */
	function ordersMagazinLogos() {
		trs.each(function () {
			var tr = $(this);
			var td = getTd(tr, 'Магазин');
			var th = ths.eq(indexes['Магазин']);
			var magazin = getTdText(tr, 'Магазин');
			var css = { 'padding-right': '5px', 'padding-left': '0' }
			var icon = getMagazinIcon(magazin);
			var size = 30;
			var img = $('<img src="' + icon + '" width="' + size + '" height="' + size + '">');
			th.css(css);
			th.find('a').css({ 'display': 'inline-block', 'width': size + 'px' }).html('&nbsp;');
			td.css(css).html(img);
		});
	}
	/* специальные символы в названиях букетов */
	function ordersSpecialCharsInBuckets() {
		trs.each(function () {
			var tr = $(this);
			var td = getTd(tr, 'Букеты в заказе');
			var text = getTdText(tr, 'Букеты в заказе');
			text = text.replaceAll('&quot;', '"');
			td.text(text);
		});
	}
	/* автокурьер */
	function ordersAutoCourier() {
		trs.each(function () {
			var tr = $(this);
			var td = getTd(tr, 'Курьер');
			var auto = getTdText(tr, 'Автокурьер');
			if (auto != 'Да') return;
			var icon = [
				'<svg width="18px" height="18px" fill="#0052cc" style="opacity:.7;margin-right:5px" viewBox="0 0 700 500" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">',
				'<g transform="matrix(1.28628,0,0,1.28628,-100.203,-110.147)">',
				'<path d="M235.95,332.29C197.329,332.29 166.055,363.599 166.055,402.204C166.055,440.809 197.328,472.083 235.95,472.083C274.572,472.083 305.864,440.81 305.864,402.204C305.86,363.599 274.555,332.29 235.95,332.29ZM235.95,434C218.415,434 204.169,419.773 204.169,402.219C204.169,384.668 218.415,370.457 235.95,370.457C253.485,370.457 267.731,384.684 267.731,402.219C267.731,419.754 253.485,434 235.95,434Z" style="fill-rule:nonzero;"/>',
				'<path d="M495.27,332.29C456.649,332.29 425.34,363.599 425.34,402.204C425.34,440.809 456.649,472.083 495.27,472.083C533.891,472.083 565.165,440.81 565.165,402.204C565.169,363.599 533.876,332.29 495.27,332.29ZM495.27,434C477.735,434 463.489,419.773 463.489,402.219C463.489,384.668 477.735,370.457 495.27,370.457C512.805,370.457 527.051,384.684 527.051,402.219C527.051,419.754 512.805,434 495.27,434Z" style="fill-rule:nonzero;"/>',
				'<path d="M594.32,305.18L594.32,271.266C594.32,256.356 606.359,244.282 621.254,244.176C620.012,194.738 609.879,148.645 591.399,126.766C568.508,99.657 550.711,87.899 494.833,87.899L280.841,87.899C261.837,87.899 253.63,98.887 246.907,118.419C230.001,167.575 215.18,219.569 215.18,219.569C215.18,219.569 116.024,232.292 93.15,234.846C79.939,236.315 76.947,252.225 79.673,271.264L106.712,271.264C118.892,271.264 128.743,281.151 128.743,293.295C128.743,305.459 118.891,315.346 106.712,315.346L86.954,315.346C101.181,390.666 111.645,418.666 143.899,420.276C142.797,414.432 142.114,408.378 142.114,402.217C142.114,350.416 184.13,308.401 235.93,308.401C287.731,308.401 329.746,350.417 329.746,402.217C329.746,408.448 329.062,414.518 327.926,420.436L403.211,420.436C402.039,414.522 401.39,408.448 401.39,402.217C401.39,350.416 443.406,308.401 495.206,308.401C547.007,308.401 588.952,350.417 588.952,402.217C588.952,408.201 588.358,414.045 587.273,419.733C618.23,415.901 616.48,357.452 618.457,332.006C604.937,330.518 594.312,319.123 594.312,305.178L594.32,305.18ZM253.05,213.653C253.839,209.786 279.702,123.512 279.702,123.512L396.412,123.512L429.541,213.653L253.05,213.653ZM467.67,213.653L434.576,123.512L469.42,123.512C508.779,123.512 526.748,136.934 537.916,149.43C549.482,162.364 553.717,172.129 558.443,213.657L467.67,213.653Z" style="fill-rule:nonzero;"/>',
				'</g>',
				'</svg>',
				'<br>'
			].join('');
			td.find('a').prepend(icon);
		});
	}
	/* кнопка копировать: инфа для курьера */
	function ordersCopyCourier() {
		/* собираем столбцы для использования в тектсе для курьера */
		var courierIndexes = {};
		var courierColsTitles = ['Дата доставки', 'Время доставки', 'Адрес доставки', 'Метро', 'Телефон получателя', 'Имя получателя', 'Себестоимость доставки', 'Комментарий клиента', 'Автокурьер'];
		$.each(courierColsTitles, function (i, title) {
			courierIndexes[title] = indexes[title];
		});
		/* столбец: тип доставки */
		trs.each(function () {
			var tr = $(this);
			if (getTdText(tr, 'Тип доставки') == 'Самовывоз') tr.addClass('samovyvoz');
		});
		/* столбец: курьер */
		trs.each(function () {
			var tr = $(this);
			var td = getTd(tr, 'Курьер');
			if (tr.is('.samovyvoz')) {
				td.text('Само\nвывоз');
			} else {
				var a = ctrlCbtn();
				a.addClass('copyForCourier');
				td.append(a);
				td.find('a').on('click', function (e) {
					e.preventDefault();
					e.stopPropagation();
					var type = $(this).is('.copyForCourier') ? 'short' : 'full';
					getAndCopy($(this).parents('tr'), type);
				});
				var deliveryPrice = $('<div style="margin-top:5px" />');
				deliveryPrice.append(getTdText(tr, 'Себестоимость доставки')).appendTo(td);
			}
		});

		function getAndCopy(tr, type) {
			var fields = {};
			var output = '';
			var titles = {};
			for (var key in courierIndexes) {
				titles[courierIndexes[key]] = key;
			}
			tr.children('td').each(function () {
				var td = $(this);
				var index = td.index();
				if (!titles[index]) return true;
				fields[titles[index]] = (td.innerText().trim() != '—' ? td.innerText().trim() : '');
			});

			/*сегодня, завтра, послезавтра*/
			var day = fields['Дата доставки'];
			var tomorrow = new Date();
			var tomtomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomtomorrow.setDate(tomtomorrow.getDate() + 2);
			var m = day.trim().match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
			deliveryDate = new Date(m[3], m[2] - 1, m[1]);
			if (deliveryDate.toDateString() == today.toDateString()) day = 'сегодня (' + day + ')';
			if (deliveryDate.toDateString() == tomorrow.toDateString()) day = 'завтра (' + day + ')';
			if (deliveryDate.toDateString() == tomtomorrow.toDateString()) day = 'послезавтра (' + day + ')';

			/*адрес*/
			var adres = fields['Адрес доставки'];
			adres = adres.replace(/\s*уточнить.*/, '');
			adres = adres.replace(/\s*☎/, '');
			if (type == 'short') adres = adres.replace(/(,\s(?:кв|эт|под)\..+$)/, '');

			/*авто*/
			var auto = (fields['Автокурьер'] == 'Да' ? 'Доставка на своем автомобиле или на такси!' : '');

			/* формируем текст */
			output += day + ' ' + fields['Время доставки'];
			output += (auto ? '\n' : '') + auto;
			output += '\n' + adres;
			if (type != 'short') {
				if (fields['Комментарий клиента']) output += '\n' + fields['Комментарий клиента'];
				if (fields['Телефон получателя'] || fields['Имя получателя']) output += '\n' + fields['Телефон получателя'] + ' / ' + fields['Имя получателя'];
			}
			if (fields['Себестоимость доставки'] != '0 ₽') output += '\n' + fields['Себестоимость доставки'];
			ctrlC(output);
		}
	}
	/* кнопка копировать: состав заказа */
	function ordersCopySostav() {
		trs.each(function () {
			var tr = $(this);
			var td = getTd(tr, 'Букеты в заказе');
			var sostav = getTdText(tr, 'Состав');
			if (!sostav || sostav == '—') return;
			sostav = parseOrdersSostav(sostav, getTdText(tr, 'Букеты в заказе'));
			if (!sostav) return;
			var a = ctrlCbtn();
			a.addClass('inline-tooltip-trigger');
			a.on('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				ctrlC(sostav);
			});
			var tooltip = $('<div class="inline-tooltip inline-tooltip_normal" style="max-width:300px;width:300px;top:0;text-align:left">' + sostav + '</div>');
			td.append(a).append(tooltip);
		});
		/* убираем из состава лишнее и формируем строку */
		function parseOrdersSostav(sostav, zakazBukets) {
			var flowers = [];
			var sostavItems = sostav.replaceAll(/шт\./g, 'шт.*separator*').split('*separator*');
			zakazBukets = parseZakazBukets(zakazBukets);
			$.each(sostavItems, function (i, item) {
				item = item.trim();
				if (!item) return;
				item = item.replace(/\s*—.*$/, '');
				if (!item.startsWith('Букет') && !item.startsWith('Цветочный микс')) item = item.replace(/\s\d+$/, '');
				item = item.replace(/\sодн|\sкуст/, ''); //убираем одн и куст (роза одн)
				item = item.replace(/\s-\s.*$/, ''); //убираем все после дефиса
				if (noFlowers.includes(item) || zakazBukets.includes(item)) return;
				flowers.push(item.toLowerCase());
			});
			if (!flowers.length) return false;
			return Array.from(new Set(flowers)).sort().join(', '); //возвращаем массив без дубликатов и по алфавиту
		}
		/* разбираемы букет из заказа */
		function parseZakazBukets(zakazBukets) {
			zakazBukets = zakazBukets.split('т),');
			$.each(zakazBukets, function (i, buket) {
				buket = buket.replace(/\(\d+\sш.*$/, ''); //удаляем штуки
				buket = buket.replace(/\s*\(.*\)/, ''); //убираем все в скобочках
				buket = buket.replace(/\s-\s.*$/, ''); //убираем все после дефиса
				buket = buket.trim();
				zakazBukets[i] = buket;
			});
			return zakazBukets;
		}
	}
	/* кнопка копировать: свой текст добавить к выебри карточке */
	function ordersCopyCustomText() {
		trs.each(function () {
			var tr = $(this);
			var td = getTd(tr, 'Текст в карточку');
			var text = getTdText(tr, 'Текст в карточку');
			if (text == '—') return true;
			var a = ctrlCbtn();
			a.addClass('inline-tooltip-trigger');
			a.on('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				ctrlC(text);
			});
			var tooltip = $('<div class="inline-tooltip inline-tooltip_normal" style="max-width:300px;width:300px;top:0;text-align:left">' + text + '</div>');
			td = td.prev();
			if (td.text().trim() == '—') td.text('со своим текстом');
			td.addClass('orderComment withCustomText').append(a).append(tooltip);
		});
	}
	/* нотификатор: нет имени/телефона/адреса получателя */
	function ordersNotifyPoluchatel() {
		trs.each(function () {
			var tr = $(this);
			if (warnException(tr)) return;
			var poluchatelData = {
				'имя': getTdText(tr, 'Имя получателя'),
				'телефон': getTdText(tr, 'Телефон получателя'),
				'адрес': getTdText(tr, 'Адрес доставки')
			};
			var poluchatelMiss = [];
			$.each(poluchatelData, function (i, value) {
				if (value && value != '—') return true;
				poluchatelMiss.push(i);
			});
			if (poluchatelData['адрес'] && poluchatelData['адрес'] != '—' && !poluchatelData['адрес'].match(/\sд\.\s/)) {
				poluchatelMiss.push('дом');
			}
			var td = getTd(tr, 'Адрес доставки');
			var poluchatelDop = $('<div class="poluchatelDop" style="position:absolute;top:0;right:0"></div>');
			poluchatelDop.appendTo(td);
			warn();
			phone();

			function warnException(tr) {
				if (tr.is('.batchHide')) return true;
				if (getTdText(tr, 'Тип доставки') != 'Доставка курьером') return true;
				if (/наличие|списание/.test(getTdText(tr, 'Покупатель'))) return true;
				return false;
			}
			function warn() {
				if (!poluchatelMiss.length) return;
				var text = '!' + poluchatelMiss.join(', ');
				if (getTdText(tr, 'Узнать адрес у получателя') == 'Да') {
					if (!poluchatelData['адрес'] || poluchatelData['адрес'] == '—') text += ' / заказчик не знает адрес';
				}
				td.css('padding-top', '17px').append('<div style="position:absolute;left:8px;top:0;font-size:.8em;line-height:17px;white-space:nowrap;padding:0 5px;height:17px;background:#edffd9">' + text + '</div>');
			}
			function phone() {
				if (poluchatelMiss.includes('телефон')) return;
				var btn = $('<a class="inline-tooltip-trigger" style="opacity:.7">☎</a>');
				var tooltip = $('<div class="inline-tooltip inline-tooltip_normal" style="max-width:140px;width:140px;top:0;text-align:left">' + poluchatelData['телефон'] + (poluchatelData['имя'] ? '<br>' + poluchatelData['имя'] : '') + '</div>');
				btn.on('click', function (e) {
					e.preventDefault();
					e.stopPropagation();
					ctrlC(poluchatelData['телефон']);
				});
				poluchatelDop.append(btn).append(tooltip);
			}
		});
	}
	/* фильтр: доставка (сегодня/завтра) */
	function ordersFilterDelivery() {
		$('.default-form-filter .filter-group').each(function () {
			if ($(this).find('.control-label span').text().trim() != 'Дата доставки') return true;
			var cont = $('<div style="margin-top:5px" />');
			for (i = -1; i <= 2; i++) {
				if (i == 1) cont.append(makeLink(makeDate(0), makeDate(1)));
				cont.append(makeLink(makeDate(i)));
			}
			$(this).append(cont);
		});
		function makeDate(i) {
			var date = new Date();
			date.setDate(date.getDate() + i);
			return {
				date: date,
				str: buildDate(date),
				dd: String(date.getDate()).padStart(2, '0'),
				mm: String(date.getMonth() + 1).padStart(2, '0'),
				yyyy: date.getFullYear()
			};
		}
		function makeLink(date1, date2 = null) {
			var title;
			if (!date2) {
				date2 = date1;
				title = date1['dd'] + '.' + date1['mm'];
				if (date1['date'].getDate() == today.getDate()) title = 'сегодня';
				if (date1['date'].getDate() - today.getDate() == 1) title = 'завтра';
			} else {
				title = date1['dd'] + '-' + date2['dd'];
			}
			var href = window.location.origin + window.location.pathname + '?filter%5BdeliveryDateFrom%5D%5Babs%5D=' + date1['str'] + '&filter%5BdeliveryDateTo%5D%5Babs%5D=' + date2['str'] + '&filter%5Bsort%5D=delivery_time_string&filter%5Bdirection%5D=asc';
			var style = 'font-size:13px;line-height:1.1em;margin-right:10px';
			return $('<a class="filterDate" href="' + href + '" style="' + style + '">' + title + '</a>');
		}
	}
	/* фильтр: дата заказа (вчера/сегодня/завтра) */
	function ordersFilterZakazDate() {
		$('.default-form-filter .filter-group').each(function () {
			var filterGroup = $(this);
			if (filterGroup.find('.control-label span').text().trim() != 'Дата оформления заказа') return true;
			var todayDate = buildDate(today);
			var yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			var yesterdayDate = buildDate(yesterday);
			var filters = {
				'вчера': '?filter%5BcreatedAtFrom%5D%5Babs%5D=' + yesterdayDate + '&filter%5BcreatedAtTo%5D%5Babs%5D=' + yesterdayDate + '&filter%5Bsort%5D=delivery_time_string&filter%5Bdirection%5D=asc',
				'сегодня': '?filter%5BcreatedAtFrom%5D%5Babs%5D=' + todayDate + '&filter%5BcreatedAtTo%5D%5Babs%5D=' + todayDate + '&filter%5Bsort%5D=delivery_time_string&filter%5Bdirection%5D=asc'
			}
			var cont = $('<div style="margin-top:5px" />');
			filterGroup.append(cont);
			$.each(filters, function (title, filter) {
				var url = '';
				url += window.location.origin;
				url += window.location.pathname;
				url += filter;
				cont.append('<a class="filterDate" href="' + url + '" style="font-size:13px;line-height:1.1em;margin-right:10px">' + title + '</a>');
			});
		});
	}
	/* фильтр: списания */
	function ordersFilterSpisanie() {
		var thisMonth = new Date();
		var prevMonth = new Date();
		prevMonth.setMonth(prevMonth.getMonth() - 1);
		var filterTitles = [
			'cписание (' + thisMonth.toLocaleString('ru-RU', { month: 'long' }) + ')',
			'cписание (' + prevMonth.toLocaleString('ru-RU', { month: 'long' }) + ')'
		];
		var thisMonthInt = startEndDates(thisMonth);
		var prevMonthInt = startEndDates(prevMonth);
		var filters = [
			'?filter%5Bcustomer%5D=Списание&filter%5BdeliveryDateFrom%5D%5Babs%5D=' + thisMonthInt[0] + '&filter%5BdeliveryDateTo%5D%5Babs%5D=' + thisMonthInt[1] + '&filter%5Bsort%5D=created_at&filter%5Bdirection%5D=desc',
			'?filter%5Bcustomer%5D=Списание&filter%5BdeliveryDateFrom%5D%5Babs%5D=' + prevMonthInt[0] + '&filter%5BdeliveryDateTo%5D%5Babs%5D=' + prevMonthInt[1] + '&filter%5Bsort%5D=created_at&filter%5Bdirection%5D=desc'
		];
		$.each(filters, function (i, value) {
			var url = '';
			url += window.location.origin;
			url += window.location.pathname;
			url += value;
			var btn = '<a href="' + url + '" style="font-size:13px;line-height:1.6em;margin-right:10px;">' + filterTitles[i] + '</a> ';
			$('#filter_customer').after(btn);
		});
		function startEndDates(d) {
			d.setDate(2);
			var start = buildDate(d);
			d.setDate(1);
			d.setMonth(d.getMonth() + 1);
			var end = buildDate(d);
			return [start, end];
		}
	}
	/* фильтр: откуда узнал */
	function ordersFilterOtkudaUznal() {
		var shown = false;
		var index = indexes['Откуда узнал о нас (в заказе)'] + 1;
		var btn = $('<a style="display:inline-block;font-size:13px;line-height:1.1em;line-height:36px;margin-left:8px;cursor:pointer">Откуда узнал</a>');
		var style = $('<style />');
		style.appendTo('body');
		btn.insertAfter($('.m-filter .parameters')).on('click', function (e) {
			e.preventDefault();
			style.text('.js-order-list tr th:nth-child(' + index + '),.js-order-list tr td:nth-child(' + index + '){display:' + (shown ? 'none' : 'table-cell') + '}');
			shown = shown ? false : true;
		});
	}
	/* фильтр: скрыть наличие и списание */
	function ordersFilterNonProductiveOrders() {
		var int = setInterval(function () {
			if (!$('.js-order-list tr').length) return;
			var batchHide = $('.batchHide');
			//batchHide.hide();
			var shown = true;
			var btn = $('<a style="display:inline-block;font-size:13px;line-height:1.1em;line-height:36px;margin-left:8px;margin-right:8px;cursor:pointer">Технические заказы</a>');
			btn.insertAfter($('.m-filter .parameters')).on('click', function (e) {
				e.preventDefault();
				if (shown) {
					batchHide.hide();
					shown = false;
				} else {
					batchHide.show();
					shown = true;
				}
			});
			clearInterval(int);
		}, 50);
	}
	/* сводка: курьеры */
	function ordersSvodkaCouriers() {
		var data = {};
		var totalAmount = 0;
		trs.each(function () {
			var tr = $(this);
			var tdCourier = getTd(tr, 'Курьер');
			var name = tdCourier.children('a:not(.copyForCourier)').text().trim();
			if (!name) return true;
			//amount
			var amount = parseInt(tdCourier.children('div').text().replaceAll(/[^0-9]/g, ''));
			totalAmount += amount;
			if (!data[name]) {
				data[name] = [];
				data[name]['amount'] = amount;
			} else {
				data[name]['amount'] += amount;
			}
			//phone
			data[name]['phone'] = getTdText(tr, 'Телефон курьера').replace(/[\s\(\)]/g, '');
			//bank
			var description = getTdText(tr, 'Примечания курьера');
			if (description == '—' || !description) {
				data[name]['bank'] = null;
			} else {
				var d = description.match(/банк:\s*(.+)\n*/);
				data[name]['bank'] = (!d || typeof d === 'undefined' ? null : d[1]);
			}
		});
		var a = $('<a href="">Сводка по оплате курьерам</a>');
		a.on('click', function (e) {
			e.preventDefault();
			var from = $('#filter_deliveryDateFrom_abs').siblings('input:last').val();
			var to = $('#filter_deliveryDateTo_abs').siblings('input:last').val();
			var text = '';
			if (from) text += 'с ' + from + ' ';
			if (to) text += 'по ' + to + ' ';
			if (from == to) text = 'за ' + from;
			text += '\n-------\n';
			if (!from && !to) text = '';
			$.each(data, function (name, arr) {
				text += name;
				text += ' / ' + arr['phone'];
				if (arr['bank']) text += ' (' + arr['bank'] + ')';
				text += ' / ' + arr['amount'] + ' р.\n';
			});
			var today = new Date();
			var time = today.getHours() + ":" + (today.getMinutes() < 10 ? '0' : '') + today.getMinutes();
			text += '-------\nскопировано в ' + time;
			ctrlC(text);
		});
		/* сводная по курьерам */
		var cont = $('<div id="tableDopSummary" style="background:#f9fafb;border-bottom:1px solid #dee2e6;padding:10px 20px;text-align:right"></div>');
		cont.insertAfter('#list-total-wrapper');
		cont.append(a);
		/* общие затраты на курьеров */
		$('#list-total-count').before('<span id="list-total-courierRashod">Расход на курьеров: ' + totalAmount + ' ₽</span>');
	}
	/* сводка: расходы на цветок/нецветок */
	function ordersSvodkaFlowersNoflowers() {
		var flowersSummary = 0;
		var neflowersSummary = 0;
		trs.each(function () {
			var tr = $(this);
			var flowersPrice = parseInt(getTdText(tr, 'Расходы на закуп цветка').replace(/[^\d]/, ''));
			var neflowersPrice = parseInt(getTdText(tr, 'Расходы на закуп нецветка').replace(/[^\d]/, ''));
			if (flowersPrice) flowersSummary += flowersPrice;
			if (neflowersPrice) neflowersSummary += neflowersPrice;
		});
		$('#list-total-count').before('<span id="list-total-flowersRashod">Расход на закуп (цветок/упак): ' + flowersSummary + ' ₽ / ' + neflowersSummary + ' ₽ </span>');
	}
	/* HELPERS */
	function getTrs() {
		return table.find('tr[data-url*="orders"]');
	}
	function getThs() {
		return table.find('tr:first th');
	}
	function getTd(tr, title) {
		return tr.children('td').eq(indexes[title]);
	}
	function getTdText(tr, title) {
		return $(getTd(tr, title)).text().trim();
	}
}
/*******************
PRODUCT
страница товара
************************/
function productPage() {
	if (!pageHasCustomJs('product')) return;
	if ($('body').is('.responsive-form')) {
		productNotEditablePage();
	} else {
		productEditablePage();
	}
	function productNotEditablePage() { }
	function productEditablePage() {
		var blocks;

		/* функции для страницы /product */
		productFunctions();
		function productFunctions() {
			var int = setInterval(function () {
				blocks = $('[data-module-name="warehouse"] .UiTabsItem_tabs-item_lNPOp');
				if (!blocks.length) return;
				blocks.show();
				ostatkiBlocksClasses();
				ostatkiReorderBlocks();
				//ostatkiHasVariantsTumbler();
				ostatkiReorganizeBlocks();
				ostatkiAmountEnhanced();
				ostatkiGreenBtns();
				ostatkiBg();
				clearInterval(int);
			}, 50);
		}

		/* добавляем классы к основным блокам */
		function ostatkiBlocksClasses() {
			var attrs = ['main', 'properties', 'variants', 'amount'];
			blocks.each(function (i, e) {
				blocks.eq(i).addClass('ostatki').attr(attrs[i], true);
			});
		}
		/* меняем блоки местами */
		function ostatkiReorderBlocks() {
			blocks.parent().append(blocks.eq(1));
		}
		/* есть торговые предложения или нет */
		function ostatkiHasVariants() {
			var rows = $('.ostatki[amount] tbody tr');
			return rows.length > 1 ? true : false;
		}
		/* цены в торговых предложениях или нет */
		function ostatkiHasPrices() {
			var props = $('.ostatki[properties]');
			if (props.find('input[value="prices"]').is(':checked')) return true;
			if (props.find('input[value="purchasePrice"]').is(':checked')) return true;
			return false;
		}
		/* есть или нет вариантов у товара */
		function ostatkiHasVariantsTumbler() {
			var tumblerText = 'Различные ценовые варианты';
			var tumbler = $('<div data-v-255e4334="" class="UiSwitch_switch_2hvMr" id="ostatkiHasVariantsTumbler"><div class="UiSwitch_switch__inner_UNbje"><label class="UiSwitch_label_1TVdi"><input type="checkbox" class="UiSwitch_switch__input_36pm9"><span class="UiSwitch_switch__thumb-wrap_HI58Y"><span class="UiSwitch_switch__thumb_3CKTY"><svg viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg" title="" class="UiIcon_icon_2pR-8 UiSwitch_switch__icon_2hDVc"><path fill-rule="evenodd" clip-rule="evenodd" d="M19.792 6.965a.77.77 0 01-.021 1.075l-9.815 9.607a1.224 1.224 0 01-1.714.006l-4.01-3.878a.77.77 0 01-.028-1.074l.684-.736a.735.735 0 011.053-.028l3.15 3.046 8.96-8.771a.735.735 0 011.053.022l.688.731z"></path></svg></span></span></label><div class="UiSwitch_switch__text_21bAo"><div data-label="" class="UiSwitch_switch__label_nvuGW">' + tumblerText + '</div></div></div></div>');
			if (ostatkiHasVariants()) tumbler.addClass('UiSwitch_switch_checked_1sx2k');
			$('.ostatki[properties] .product-properties').prepend(tumbler);
			tumbler.on('click', function (e) {
				e.preventDefault();
				$(this).toggleClass('UiSwitch_switch_checked_1sx2k');
				$('.ostatki[properties] .UiCheckbox_checkbox_CP9FX').trigger('click'); /* имитируем клик по чекбоксам */

			});
		}
		/* улучшаем блоки */
		function ostatkiReorganizeBlocks() {
			var variants = $('.ostatki[variants] .product-offers__collapse-box');
			var table = $('.ostatki[amount] .table');
			var trs = table.find('tbody > .table__row');
			/* класс "multiple" для таблицы остатков */
			if (trs.length > 1) table.attr('multiple', true);
			trs.each(function (i, e) {
				var tr = $(this);
				var td = tr.find('.table__offers.table__offers_big');
				var cont = $('<div class="priceData"></div>');
				/* название товара */
				td.contents().wrap('<span class="caption"></span>');
				/* onePrice (галочки цен выключены) */
				if (!i) {
					var cont2 = cont.clone();
					cont2.addClass('onePrice');
					var pricesSingle = $('.ostatki[main] > div > .UiCollapseBox_box_XPylv:nth-child(3)');
					cont2.append(pricesSingle);
					td.append(cont2);
				}
				/* manyPrices (галочки цен включены) */
				cont.addClass('manyPrices');
				cont.append(variants.eq(i));
				td.append(cont);
			});
			ostatkiAmountListener(table, trs.length);
			ostatkiVariantsOrder(table, trs);
		}
		/* торговые предложения по алфавиту */
		function ostatkiVariantsOrder(table, trs) {
			var rows = trs.get();
			rows.sort(function (a, b) {
				var keyA = parseInt($(a).find('.caption').text().trim().replace(/[^\d]/g, ''));
				ostatkiApproxZakupPrice($(a).find('.product-offers__title > div:first-child'), keyA);
				var keyB = parseInt($(b).find('.caption').text().trim().replace(/[^\d]/g, ''));
				ostatkiApproxZakupPrice($(b).find('.product-offers__title > div:first-child'), keyB);
				if (keyA < keyB) return -1;
				if (keyA > keyB) return 1;
				return 0;
			});
			$.each(rows, function (i, row) {
				table.children('tbody').append(row);
			});
			function ostatkiApproxZakupPrice(caption, price) {
				if (caption.children('.approxPrice').length) return;
				var mid = Math.round(price / 3);
				var min = mid - 25;
				var max = mid + 25;
				caption.append('<span class="approxPrice">~' + mid + ' ₽</span>');
			}
		}
		/* следим за изменением количества торговых предложений
		если добавлено новое, перезагружаем страницу */
		function ostatkiAmountListener(table, oldVal) {
			var int = setInterval(function () {
				var newVal = table.find('tbody > .table__row').length;
				if (newVal == oldVal) return;
				/* если добавили второе торговое предложение */
				if (newVal != oldVal && oldVal == 1) {
					clearInterval(int);
					window.location.reload();
				}
				if (newVal > 1) {
					/* если торговое предложение одно */
					table.attr('multiple', true);
				} else {
					/* если торговых предложений несколько */
					table.removeAttr('multiple');
				}
			}, 50);
		}
		/* улучшаем таблицу "остатки" */
		function ostatkiAmountEnhanced() {
			/* пишем правльный заголовок таблицы */
			amountTHead();
			function amountTHead() {
				var thead = $('.ostatki[amount] thead');
				thead.empty();
				var td1 = $('<td data-v-53aac5c2>Название товара / Закупочная цена / Реализационная цена</td>');
				var td2 = $('<td data-v-53aac5c2>Количество товаров в остатках</td>');
				var tr = $('<tr data-v-53aac5c2 class="table__row table__header" />');
				tr.append(td1).append(td2);
				thead.append(tr);
			}
			/* улучшаем инпуты */
			amountInputs();
			function amountInputs() {
				var inputs = $('.ostatki[amount] .table__warehouse-data input[type="text"]');
				inputs.each(function () {
					/* показываем подсказку "сколько было" до изменения */
					var input = $(this);
					var val = input.val();
					var valArr = val.split('.');
					if (!valArr[1] || valArr[1] == '000') {
						val = valArr[0];
					} else {
						val = parseFloat(val).toFixed(1);
					}
					var info = $('<div class="plusMinusChangedInfo">Было: <span class="oldVal">' + val + '</span>');
					input.parent().after(info);
					/* очищаем инпут на фокусе */
					input.on('focus', function () {
						input.val('');
					});
				});
				$('.ostatki[amount] .btn-save').on('click', function () {
					inputs.each(function () {
						$(this).parent().parent().find('.plusMinusChangedInfo .oldVal').text($(this).val());
					});
				});
			}
		}
		/* кнопки "сохранить" зеленые */
		function ostatkiGreenBtns() {
			var btns = $('.ostatki .UiButton_btn_primary-success_3CPeN');
			if (!btns.length) return;
			var captions = ['Обновить количество товаров', 'Применить'];
			btns.each(function (i, e) {
				$(this).find('.UiButton_btn__txt_lBLyT').text(captions[i]);
			});
		}
		/* белый фон */
		function ostatkiBg() {
			$('.inner-wrapper__content').css('background', '#fff');
		}
	}
}
/*******************
КУРЬЕР
************************/
function courierPage() {
	if (!pageHasCustomJs('courier')) return;

	var descr;
	var int = setInterval(function () {
		descr = $('#intaro_crmbundle_couriertype_description');
		if (!descr.length) return;

		courierBank();
		courierReloadOnSave();

		clearInterval(int);
	}, 50);
	/* перезагрузка после сохранения */
	function courierReloadOnSave() {
		$('body').on('click', 'button[name="submit"]', function () {
			setTimeout(function () {
				location.reload();
			}, 500);
		});
	}
	/* добавляем возможность добавить курьеру банк */
	function courierBank() {

		var descrClone;
		var bankSelect;
		var bank;

		/* создаем селект для банка */
		var options = ['', 'Сбер', 'Тинькофф', 'Альфа', 'Райффайзен', 'ВТБ', 'СГБ', 'Газпром', 'Россельхоз'];
		bankSelect = $('<select id="courierBank"></select>');
		$.each(options, function (i, e) {
			bankSelect.append('<option value="' + e + '">' + e + '</option>');
		});
		var block = $('<div class="control-group"><div class="control-label"><label for="courierBank"><span>Банк</span></label></div><div class="controls"></div></div>');
		bankSelect.appendTo(block.find('.controls'));
		var e = $('form[name="intaro_crmbundle_couriertype"] .control-group:nth-child(5)');
		block.insertAfter(e);

		/* создаем клон примечания */
		descrClone = descr.clone();
		descrClone.removeAttr('id').removeAttr('name').insertAfter(descr);
		descrClone.val(descr.val().replace(/банк.+\n*/g, ''));
		descr.hide();

		/* определяем банк */
		var bank = descr.val().match(/банк:\s(.+)\n*/);
		bank = (Array.isArray(bank) && bank[1] ? bank[1] : '');
		bankSelect.children('option[value="' + bank + '"]').prop('selected', true);

		/* обновляем данные о банке */
		bankSelect.on('change', function () {
			var text = '';
			if (bankSelect.val()) text += 'банк: ' + bankSelect.val() + '\n';
			text += descrClone.val();
			descr.val(text);
		});
	}
}
/*******************
ЛЕВОЕ МЕНЮ
************************/
function leftMenu() {
	var int = setInterval(function () {
		var menu = $('#nav-bar');
		if (!menu.length) return;
		if (!menu.find('.nav-btn').length) return;

		analyticsBtnMoveDown();

		clearInterval(int);
	}, 50);

	/* переносим аналитику вниз */
	function analyticsBtnMoveDown() {
		var a = $('.nav-btn_analytics');
		a.insertAfter(a.siblings(':last'));
	}
}
/*******************
СКРЫТЬ ОТ ПОСТОРОННИХ
************************/
function hiddenFinance() {
	$('html').addClass('hiddenFinance');
	$(window).on('keypress', function (e) {
		/* shift+space */
		if (e.shiftKey && e.which == 32) {
			e.preventDefault();
			$('html').toggleClass('hiddenFinance');
		}
	});
}


/*******************
HELPERS
************************/

/* кнопка для копирования */
function ctrlCbtn() {
	return $('<a style="position:absolute;top:2px;right:5px">❐</a>');
}
/* загнать в буфер обмена */
function ctrlC(text) {
	var $temp = $('<textarea>');
	$('body').append($temp);
	$temp.val(text).select();
	document.execCommand('copy');
	$temp.remove();
}
/* вернуть дату в виде правильной строки */
function buildDate(d) {
	var yyyy = d.getFullYear();
	var mm = String(d.getMonth() + 1).padStart(2, '0');
	var dd = String(d.getDate()).padStart(2, '0');
	return yyyy + '-' + mm + '-' + dd;
}
/* иконка магазина */
function getMagazinIcon(magazin) {
	var icon;
	switch (magazin) {
		case 'STAY TRUE Flowers':
			icon = 'https://static.tildacdn.com/tild3932-6161-4664-b130-613137393138/white.png';
			break;
		case '2STEBLYA':
			icon = 'https://static.tildacdn.com/tild3334-3237-4466-b631-373430336533/_2steblya__.png';
			break;
		default:
			icon = 'https://static.tildacdn.com/tild6532-3034-4631-b533-626430643963/flower.png';
			break;
	}
	return icon;
}
/* иконка месенджера */
function getMessengerIcons(iconSize) {
	return {
		Telegram: '<svg width="' + iconSize + '" height="' + iconSize + '" viewBox="0 0 100 100" fill="#1d98dc" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M50 100c27.614 0 50-22.386 50-50S77.614 0 50 0 0 22.386 0 50s22.386 50 50 50Zm21.977-68.056c.386-4.38-4.24-2.576-4.24-2.576-3.415 1.414-6.937 2.85-10.497 4.302-11.04 4.503-22.444 9.155-32.159 13.734-5.268 1.932-2.184 3.864-2.184 3.864l8.351 2.577c3.855 1.16 5.91-.129 5.91-.129l17.988-12.238c6.424-4.38 4.882-.773 3.34.773l-13.49 12.882c-2.056 1.804-1.028 3.35-.129 4.123 2.55 2.249 8.82 6.364 11.557 8.16.712.467 1.185.778 1.292.858.642.515 4.111 2.834 6.424 2.319 2.313-.516 2.57-3.479 2.57-3.479l3.083-20.226c.462-3.511.993-6.886 1.417-9.582.4-2.546.705-4.485.767-5.362Z"></path></svg>',
		Whatsapp: '<svg width="' + iconSize + '" height="' + iconSize + '" viewBox="0 0 100 100" fill="#52ce5f" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100ZM69.7626 28.9928C64.6172 23.841 57.7739 21.0027 50.4832 21C35.4616 21 23.2346 33.2252 23.2292 48.2522C23.2274 53.0557 24.4823 57.7446 26.8668 61.8769L23 76L37.4477 72.2105C41.4282 74.3822 45.9107 75.5262 50.4714 75.528H50.4823C65.5029 75.528 77.7299 63.301 77.7363 48.2749C77.7408 40.9915 74.9089 34.1446 69.7626 28.9928ZM62.9086 53.9588C62.2274 53.6178 58.8799 51.9708 58.2551 51.7435C57.6313 51.5161 57.1766 51.4024 56.7228 52.0845C56.269 52.7666 54.964 54.2998 54.5666 54.7545C54.1692 55.2092 53.7718 55.2656 53.0915 54.9246C52.9802 54.8688 52.8283 54.803 52.6409 54.7217C51.6819 54.3057 49.7905 53.4855 47.6151 51.5443C45.5907 49.7382 44.2239 47.5084 43.8265 46.8272C43.4291 46.1452 43.7837 45.7769 44.1248 45.4376C44.3292 45.2338 44.564 44.9478 44.7987 44.662C44.9157 44.5194 45.0328 44.3768 45.146 44.2445C45.4345 43.9075 45.56 43.6516 45.7302 43.3049C45.7607 43.2427 45.7926 43.1776 45.8272 43.1087C46.0545 42.654 45.9409 42.2565 45.7708 41.9155C45.6572 41.6877 45.0118 40.1167 44.4265 38.6923C44.1355 37.984 43.8594 37.3119 43.671 36.8592C43.1828 35.687 42.6883 35.69 42.2913 35.6924C42.2386 35.6928 42.1876 35.6931 42.1386 35.6906C41.7421 35.6706 41.2874 35.667 40.8336 35.667C40.3798 35.667 39.6423 35.837 39.0175 36.5191C38.9773 36.5631 38.9323 36.6111 38.8834 36.6633C38.1738 37.4209 36.634 39.0648 36.634 42.2002C36.634 45.544 39.062 48.7748 39.4124 49.2411L39.415 49.2444C39.4371 49.274 39.4767 49.3309 39.5333 49.4121C40.3462 50.5782 44.6615 56.7691 51.0481 59.5271C52.6732 60.2291 53.9409 60.6475 54.9303 60.9612C56.5618 61.4796 58.046 61.4068 59.22 61.2313C60.5286 61.0358 63.2487 59.5844 63.8161 57.9938C64.3836 56.4033 64.3836 55.0392 64.2136 54.7554C64.0764 54.5258 63.7545 54.3701 63.2776 54.1395C63.1633 54.0843 63.0401 54.0247 62.9086 53.9588Z"></path></svg>'
	}
}
/* $.innerText() то же самое что и jQuery.text(), но с сохранением переносов строки */
(function ($) {
	$.fn.innerText = function (msg) {
		if (msg) {
			if (document.body.innerText) {
				for (var i in this) {
					this[i].innerText = msg;
				}
			} else {
				for (var i in this) {
					this[i].innerHTML.replace(/&amp;lt;br&amp;gt;/gi, "n").replace(/(&amp;lt;([^&amp;gt;]+)&amp;gt;)/gi, "");
				}
			}
			return this;
		} else {
			if (document.body.innerText) {
				return this[0].innerText;
			} else {
				return this[0].innerHTML.replace(/&amp;lt;br&amp;gt;/gi, "n").replace(/(&amp;lt;([^&amp;gt;]+)&amp;gt;)/gi, "");
			}
		}
	};
})(jQuery);