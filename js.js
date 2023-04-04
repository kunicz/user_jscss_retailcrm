console.log('User Javascript Enabled');

var today = new Date();

/* игнорировать страницы, для которых еще не написан custom JS */
function pageHasCustomJs(page = null) {
	var pages = {
		orders: 'orders/$',
		order: 'orders/\\d+',
		order_new: 'orders/add',
		product: 'products/\\d+',
		courier: 'admin/couriers/\\d+'
	};
	//если знаем страницу, которую проверяем
	if (page) return testPage(pages[page]);
	//если не знаем
	var hasJs = false;
	$.each(pages, function (i) {
		if (testPage(pages[i])) {
			hasJs = true;
			return false;
		}
	});
	return hasJs;
	function testPage(p) {
		return (new RegExp(p)).test(window.location.pathname);
	}
}

/* при изменении в адресной строке перезагружать страницу */
alwaysReloadOnHrefChange();
function alwaysReloadOnHrefChange() {
	var href = window.location.href;
	setInterval(function () {
		if (href == window.location.href) return;
		href = window.location.href;
		if (!pageHasCustomJs()) return;
		window.location.reload();
	}, 50);
}

/* скрыть финансовую информацию */
hiddenFinance();
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

/* торговые предложение не из группы "срезка" */
function noFlowers() {
	var upak = ['Транспортировочное', 'Упаковка', 'Декор', 'Оазис', 'Основа', 'Поддон', 'Яйцо', 'Свеча', 'Секатор', 'Игрушка'];
	var container = ['Ящик', 'Сердце', 'Кастрюля', 'Корзина', 'Горшок', 'Коробка'];
	return [...upak, ...container];
}

/********************
ORDER
страница заказа
*********************/
orderPage();
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
		orderPayedVSTovars();
		orderCustomFieldsToRight();
		orderFloristField();
		orderFlowersRashod();
		orderReloadOnSave();

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
		//таймаут нужен, чтоб сначала страница успела загрузиться
		setTimeout(function () {
			var fieldBucket = $('#intaro_crmbundle_ordertype_customFields_bukety_v_zakaze');
			var fieldCard = $('#intaro_crmbundle_ordertype_customFields_card');
			if (fieldBucket.val() != buckets.join(', ')) fieldBucket.val(buckets.join(', '));
			if (fieldCard.val() != cards.join(', ')) fieldCard.val(cards.join(', '));
			/*
			fieldBucket.prop('disabled',true);
			fieldCard.prop('disabled',true);
			*/
		}, 2000);
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
			'STAY TRUE Flowers': 'Упаковка'
		}
		searchTransport();
		$('#intaro_crmbundle_ordertype_site').on('change', function () {
			searchTransport();
		});
		/* проверяем магазин и наличие транспортировочного */
		function searchTransport() {
			magazin = getMagazin();
			if (!Object.keys(transportByMagazin).includes(magazin)) return;
			var exist = false;
			tovars.each(function () {
				if ($(this).find('.title .tr-link').text() != transportByMagazin[magazin]) return;
				exist = true;
				return false;
			});
			if (!exist) addTransport();
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
							if (magazin == 'STAY TRUE Flowers') $(this).find('.product-count__area').val(2); //две упаковки для STF
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
					delivery500();
					clearInterval(int);
				}, 1000);
			}, 50);
		}
		/* уменьшаем стоимость букеа на стоимость транспортировочного */
		function decriseTovarPrice() {
			tovars.each(function () {
				if (!isBuket($(this))) return true;
				var inputTd = $(this).find('td.price');
				var input = inputTd.find('.order-price__main .order-value-input');
				var price = parseInt($(this).find('.order-product-properties span[title^="цена"]').text().replace(/[^\d]/g, ''));
				var decrease = {
					'2STEBLYA': 1000,
					'STAY TRUE Flowers': 100
				};
				inputTd.find('.order-price__value').trigger('click');
				input.val(price - decrease[magazin]);
				inputTd.find('.order-price__button_submit').trigger('click');
				return false;
			});
		}
		/* стоимость доставки */
		function delivery500() {
			var price = 500;
			$('#delivery-cost').val(price);
			$('.order-delivery-cost__value-static').eq(0).html(' ' + price + '<span class="currency-symbol rub">₽</span>');
		}
	}
	/* оплачено рядом с ценой */
	function orderPayedVSTovars() {
		var payed = getPayedMoney();
		if (!payed) return;
		$('#order-total-summ').after('<span title="оплачено"> / ' + payed.toString().replace(/(.{3})$/, ' $1') + ' <span class="currency-symbol rub">₽</span></span>');
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
				if (noFlowers().includes(title)) {
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
	/* перезагрузить страницу, если сохраняем и не выхоидим */
	function orderReloadOnSave() {
		$('body').on('click', 'button[name="save"],button[name="set_status_button"]', function () {
			smartReload();
		});
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
			var pay = $(this).text().replace(/[^\d]/g, '');
			payed += parseInt(pay);
		});
		return payed;
	}
	function getDeliveryMoney() {
		return parseInt($('#delivery-cost').val().replace(/,.*/, ''));
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
ordersPage();
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
		'Оплачено',
		'Телефон курьера',
		'Примечания курьера',
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
		if (!trs.length) return;
		ths = getThs();

		ordersTdIndexes();
		ordersHideHiddenCols();
		ordersNewOrderAppear();
		ordersReloadPage();
		ordersColoredRows();
		ordersComments();
		ordersOnanim();
		ordersMessenger();
		ordersVip();
		ordersId();
		ordersCurrentMonneyVsOplata();
		ordersNoIdentic();
		ordersAdresOptimize();
		ordersMagazinLogos();
		ordersCopyCourier();
		ordersCopySostav();
		ordersCopyCustomText();
		ordersNotifyPoluchatel();
		ordersOrderByCreationDate();
		ordersFilterDelivery();
		ordersFilterZakazDate();
		ordersFilterSpisanie();
		ordersFilterOtkudaUznal();
		ordersFilterNalichieSpisanie();
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
	/* если появляется новый заказ на открытой странице */
	function ordersNewOrderAppear() {
		var oldVal = trs.length;
		setInterval(function () {
			trs = getTrs();
			if (oldVal == trs.length) return;
			ordersHideHiddenCols();
			oldVal = trs.length;
		}, 1000);
	}
	/* обновляем страницу, если было изменение по клику на что-то */
	function ordersReloadPage() {
		$('body').on('click', 'button[type="submit"],#multiple-status-change-button,#multiple-courier-change a,a.filterDate', function () {
			smartReload();
		});
	}
	/* подкрашиваем строки */
	function ordersColoredRows() {
		trs.each(function () {
			var tr = $(this);
			var color = null;
			if (getTdText(tr, 'Магазин') == 'STAY TRUE Flowers') color = 'fffaff';
			switch (getTdText(tr, 'Покупатель')) {
				case 'Списание Порча':
				case 'Списание Недостача':
					color = 'fff3ee';
					tr.addClass('spisanie batchHide');
					break;
				case 'Наличие':
					color = 'e6fff1';
					tr.addClass('nalichie batchHide');
					break;
			}
			if (!color) return true;
			tr.css('background-color', '#' + color);
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
			getTd(tr, 'Чат').html(texts.join('<br><br>'));
			ths.eq(indexes['Чат']).text('Коммментарии');
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
	function ordersCurrentMonneyVsOplata() {
		trs.each(function () {
			var tr = $(this);
			var tdSumma = getTd(tr, 'Сумма');
			/* скидка */
			var skidkaAmount = getTdText(tr, 'Скидка в процентах');
			if (skidkaAmount != '—' && skidkaAmount != 0) {
				$('<div style="position:absolute;top:0;right:0;font-size:10px;background:#ff7a93;color:#fff;line-height:15px;padding:0 4px">' + getTdText(tr, 'Скидка в процентах') + '%</div>').appendTo(tdSumma);
			}
			/* оплата */
			var tdOplata = getTd(tr, 'Оплачено');
			var summaAmount = tdSumma.get(0).childNodes[0].nodeValue;
			var oplataAmount = tdOplata.get(0).childNodes[0].nodeValue;
			if (summaAmount != oplataAmount) {
				$('<div style="font-size:.9em;opacity:.5">Оплачено:<br>' + getTdText(tr, 'Оплачено') + '</div>').appendTo(tdSumma);
			}
		});
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
			/* ссылка для Я.карт */
			adres = adres.replace(/(^.*(?:ул|наб|бул|ш|пр\-кт|пр\-д|пер|пл|алл)\.\s(?:[^,])+,\sд\.\s(?:[^,])+(?:,\s(?:корп\.|стр\.)\s[^,]+)*)/, '<a class="yadres">$1</a>');
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
	/* кнопка копировать: инфа для курьера */
	function ordersCopyCourier() {
		/* собираем столбцы для использования в тектсе для курьера */
		var courierIndexes = {};
		var courierColsTitles = ['Дата доставки', 'Время доставки', 'Адрес доставки', 'Метро', 'Телефон получателя', 'Имя получателя', 'Себестоимость доставки', 'Комментарий клиента'];
		$.each(courierColsTitles, function (i, title) {
			courierIndexes[title] = indexes[title];
		});
		/* столбец: тип доставки */
		trs.each(function () {
			var tr = $(this);
			var td = getTd(tr, 'Тип доставки');
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

			/* формируем текст */
			output += day + ' ' + fields['Время доставки'];
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
		/* разбираем состав */
		function parseOrdersSostav(sostav, zakazBukets) {
			sostav = sostav.replaceAll(/шт\./g, 'шт.*separator*');
			var flowers = [];
			var sostavItems = sostav.split('*separator*');
			zakazBukets = parseZakazBukets(zakazBukets);
			$.each(sostavItems, function (i, item) {
				if (!item) return;
				var isFlower = true;
				var sostavItemProps = item.trim().replace('шт.', '').replace('₽,', '—').split('—');
				$.each(sostavItemProps, function (j, prop) {
					prop = prop.trim();
					switch (j) {
						case 0:	//название
							//убираем цену из названия (роза 300)
							if (!prop.startsWith('Букет') && !prop.startsWith('Цветочный микс')) prop = prop.replace(/\s\d+/, '');
							prop = prop.replace(/\sодн|\sкуст/, ''); //убираем одн и куст (роза одн)
							prop = prop.replace(/\s*\(.*\)/, ''); //убираем все в скобочках
							prop = prop.replace(/\s-\s.*$/, ''); //убираем все после дефиса
							if (noFlowers().includes(prop) || zakazBukets.includes(prop)) isFlower = false;
							break;
						case 2:	//количество
							if (!prop) isFlower = false;
							break;
					}
					sostavItemProps[j] = prop;
				});
				sostavItems[i] = sostavItemProps;
				if (isFlower) flowers.push(sostavItemProps[0].toLowerCase());
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
			if (getTdText(tr, 'Тип доставки') != 'Доставка курьером') return;
			if (getTdText(tr, 'Покупатель').match(/Наличие|Списание/)) return;
			var poluchatel = {
				'имя': getTdText(tr, 'Имя получателя'),
				'телефон': getTdText(tr, 'Телефон получателя'),
				'адрес': getTdText(tr, 'Адрес доставки')
			};
			var poluchatelMiss = [];
			$.each(poluchatel, function (i, value) {
				if (value && value != '—') return true;
				poluchatelMiss.push(i);
			});
			var td = getTd(tr, 'Адрес доставки');
			var cont = $('<div class="poluchatelDop" style="position:absolute;top:0;right:0"></div>');
			cont.appendTo(td);
			warn();
			phone();

			function warn() {
				if (!poluchatelMiss.length) return;
				var text = 'уточнить ' + poluchatelMiss.join(', ');
				if (getTdText(tr, 'Узнать адрес у получателя') == 'Да') {
					if (!poluchatel['адрес'] || poluchatel['адрес'] == '—') text += ' / заказчик не знает адрес';
				}
				/*
				var btn = $('<div class="poluchatelWarn inline-tooltip-trigger">⚠️</div>');
				var tooltip = $('<div class="inline-tooltip inline-tooltip_normal" style="max-width:140px;width:140px;top:0;text-align:left">'+text+'</div>');
				cont.append(btn).append(tooltip);
				*/
				td.css('padding-top', '17px').append('<div style="position:absolute;left:15px;top:0;font-size:.8em;line-height:17px;white-space:nowrap;padding:0 5px;height:17px;background:#edffd9">' + text + '</div>');
			}
			function phone() {
				if (poluchatelMiss.includes('телефон')) return;
				var btn = $('<a class="inline-tooltip-trigger" style="opacity:.7">☎</a>');
				var tooltip = $('<div class="inline-tooltip inline-tooltip_normal" style="max-width:140px;width:140px;top:0;text-align:left">' + poluchatel['телефон'] + (poluchatel['имя'] ? '<br>' + poluchatel['имя'] : '') + '</div>');
				btn.on('click', function (e) {
					e.preventDefault();
					e.stopPropagation();
					ctrlC(poluchatel['телефон']);
				});
				cont.append(btn).append(tooltip);
			}
		});
	}
	/* по умолчанию сортировка по дате создания заказа */
	function ordersOrderByCreationDate() {
		if (window.location.search) return;
		window.location.search = '?filter%5Bsort%5D=created_at&filter%5Bdirection%5D=desc';
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
	function ordersFilterNalichieSpisanie() {
		var int = setInterval(function () {
			if (!$('.js-order-list tr').length) return;
			var batchHide = $('.batchHide');
			//batchHide.hide();
			var shown = true;
			var btn = $('<a style="display:inline-block;font-size:13px;line-height:1.1em;line-height:36px;margin-left:8px;margin-right:8px;cursor:pointer">Наличие/списание</a>');
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
productPage();
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
courierPage();
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
leftMenu();
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
HELPERS
************************/

/* перезагружать страницу только после того, как crm загрузит все формы на сервер (появится и пропадет прелоадер)
на очень быстром интернете не успевает срабатывать */
readyToReload = false;
function smartReload() {
	//перезагружаем только после того, как стандартный лоадер отработает и пропадет
	var int = setInterval(function () {
		console.log('waiting for save');
		//stat-box-popup-bg overpage bg-light o-bg black-red-loader
		var loader = $('.black-red-loader');
		if (!loader.length && !readyToReload) return;
		readyToReload = true;
		if (loader.length && readyToReload) return;
		readyToReload = false;
		clearInterval(int);
		location.reload();
	}, 1);
}
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