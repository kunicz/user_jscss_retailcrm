import { popup } from "./order_propducts_popup";
import { vehicleFormats } from "../mappings";
import { retailcrm, db, normalize, wait } from '@helpers';
import { noFlowers, getOrderId } from '../order';
import '../css/order_products.css';
const money = {
	flowers: 0, // закупочная стоимость цветов в заказе
	noFlowers: 0, //закупочная стоимость нецветов и допников в заказе
	zakup: 0, //реализационная стоимость цветов и нецветов в заказе
	dostavka: 0, //стоимость доставки
	total: 0, //стоимость каталожных товаров в заказе
	paid: 0, //сколько оплачено
	current: 0 //сколько потрачено над анный момент
}
const observer = new MutationObserver(async () => {
	try {
		hideInfiniteOstatki();
		await productsClassesByType();
		productsSummary();
		purchaseDopnikPrice();
		properties();
		//autoCouirer();
		availableInventory();
		orderASC();
		await addTransport();
	} catch (e) {
		console.error(e);
	}
});

export async function products() {
	try {
		listen();
		table();
		dostavkaPrice();
		hideInfiniteOstatki();
		sebes();
		popup();
		await productsClassesByType();
		cardSummary();
		productsSummary();
		purchaseDopnikPrice();
		properties();
		autoCouirer();
		availableInventory();
		orderASC();
		await addTransport();
		await rashod();
	} catch (e) {
		console.error(e);
	}
}

function listen() {
	observer.observe(document.querySelector('#order-products-table'), { childList: true, subtree: false });
}

function table() {
	$('#order-products-table thead .title').text('Товар');
}

//определяем тип товаров (каталожный/с фоточкой и допник)
async function productsClassesByType() {
	const promises = $('#order-products-table tbody').toArray().map(async (product) => {
		const $product = $(product);
		if ($product.is('.catalog')) return;
		if (!$product.find('.image img').length) return;
		$product.addClass('catalog');
		try {
			const productCrm = await retailcrm.get.product.byId(getProductId($product));
			const requestData = {
				request: 'products/get',
				args: {
					fields: [
						'type'
					],
					where: {
						id: productCrm.externalId,
						shop_crm_id: productCrm.catalogId
					},
					limit: 1
				}
			}
			const type = await db.request(requestData);
			if (type == 666) $product.addClass('podpiska');
			if (type == 888) $product.addClass('dopnik');
			if (type == 1111) $product.addClass('donat');
		} catch ($e) { }
	});
	await Promise.all(promises);
}

async function addTransport() {
	//Транспортировочное не нужно добавлять если:
	//в заказе уже есть транспортирочное
	if ($('#order-products-table td.title a').filter((_, t) => $(t).text().trim() === 'Транспортировочное').length) return;

	//в заказе нет товаров с картинкой (.catalog)
	if (!$('#order-products-table .catalog').length) return;

	//товары с картинкой это не только допники или донаты (.dopnik / .donat)
	const catalogItems = document.querySelectorAll('#order-products-table .catalog').length;
	const dopnikItems = document.querySelectorAll('#order-products-table .dopnik').length;
	const donatItems = document.querySelectorAll('#order-products-table .donat').length;
	if (catalogItems === dopnikItems + donatItems) return;

	//если не назначен флорист
	if (!$('#intaro_crmbundle_ordertype_customFields_florist').val()) return;

	//сохраняем заказ
	$('#main button[type="submit"]').trigger('click');

	observer.disconnect(); //отключаем обсервер, иначе он сходит с ума и запускает бесконечный цикл
	await wait(1000); //ждем секунду, чтоб срм успела сохранить заказ
	toggleFreeze(true);
	const orderId = getOrderId();
	const response = await fetch(`https://php.2steblya.ru/ajax?script=RetailCrm_AddTransport&id=${orderId}&logger`)
		.then(res => res.json())
		.catch(e => console.error('Ошибка запроса:', e));
	if (response.success) {
		window.location.reload();
	} else {
		toggleFreeze(false);
		alert('Транспортировочное не добавлено');
		listen(); // включаем обсервер
	}

	function toggleFreeze(toggle = true) {
		$('body').css('opacity', toggle ? .2 : 1).attr('disabled', toggle);
	}
}

function hideInfiniteOstatki() {
	//в каждом товаре теперь есть информация о наличии остатков на складе
	//скрываем для тех, у кого их бесконечно (транспортировочное, декор и пр.)
	$('#order-products-table [data-available-quantity]').each((_, e) => {
		const $e = $(e);
		if (parseInt($e.attr('data-available-quantity')) < 100) return;
		$e.parent().hide();
	});
}

function orderASC() {
	observer.disconnect();
	const temp = {};
	const tempCatalog = {};
	const tempDopnik = {};
	$('#order-products-table tbody').each((_, product) => {
		const $product = $(product);
		const title = $product.find('.title a').text();
		if (!$product.is('.catalog')) {
			temp[title] = $product.detach();
		} else {
			if ($(product).is('.dopnik')) {
				tempDopnik[title] = $product.detach();
			} else {
				tempCatalog[title] = $product.detach();
			}
		}
	});
	Object.keys(tempCatalog).sort().forEach(key => $('#order-products-table').append(tempCatalog[key]));
	Object.keys(tempDopnik).sort().forEach(key => $('#order-products-table').append(tempDopnik[key]));
	Object.keys(temp).sort().forEach(key => $('#order-products-table').append(temp[key]));
	listen();
}

function autoCouirer() {
	$('#order-products-table tbody').each((_, product) => {
		const $product = $(product);
		if (!$product.is('.catalog')) return;
		const format = $product.find('.order-product-properties > span[title^="фор"]');
		if (!format.length) return;
		const conditions = [
			$product.find('.title a') == 'БОЛЬШОЙ ДОБРЫЙ СЧАСТЛИВЫЙ МЕДВЕДЬ',
			vehicleFormats.includes($product.find('.order-product-properties > span[title^="фор"]').attr('title').split(": ")[1])
		];
		if (!conditions.includes(true)) return;
		$('#intaro_crmbundle_ordertype_customFields_auto_courier').prop('checked', true);
		return false;
	});
}

function cardSummary() {
	const summary = [];
	$('#order-products-table tbody').each((_, product) => {
		const $product = $(product);
		if (!$product.is('.catalog')) return;
		const card = $product.find('.order-product-properties > span[title*="карточк"]');
		if (!card.length) return;
		summary.push(card.attr('title').split(": ")[1]);
	});
	//удаляем дубликаты
	//исхожу из того, что не бывает такого, что есть в одном заказе два букета и оба со своим текстом, причем разным
	//во всех остальных случаях, кажется, этого будет достаточно
	const summaryUniqs = [...new Set(summary)];
	const input = $('#intaro_crmbundle_ordertype_customFields_card');
	const value = summaryUniqs.length < 1 ? '' : summaryUniqs.length == 1 ? summaryUniqs[0] : 'разные для букетов';
	if (!summaryUniqs.length) return;
	if (input.val() == value) return;
	input.val(value);
}

function productsSummary() {
	const summary = [];
	$('#order-products-table tbody').each((_, product) => {
		const $product = $(product);
		if (!$product.is('.catalog')) return;
		summary.push(`${$product.find('.title a').text()} (${parseFloat($product.find('.quantity input').val())} шт)`);
	});
	const input = $('#intaro_crmbundle_ordertype_customFields_bukety_v_zakaze');
	const value = summary.join(',<br>');
	input.parent().hide();
	if (input.val() == value) return;
	input.val(value);
}

async function purchaseDopnikPrice() {
	const promises = $('#order-products-table tbody').toArray().map(async (product) => {
		const $product = $(product);
		if (!$product.is('.dopnik')) return;
		const input = $product.find('td.purchase-price input.purchase-price');
		if (parseInt(input.val() > 0)) return;
		const productCrm = await retailcrm.get.product.byId(getProductId($product));
		const requestData = {
			request: 'products/get',
			args: {
				fields: [
					'purchase_price'
				],
				where: {
					id: productCrm.externalId,
					shop_crm_id: productCrm.catalogId
				},
				limit: 1
			}
		}
		const purchase_price = await db.request(requestData);
		if (input.val() == purchase_price) return;
		input.val(purchase_price).change();
		$product.find('td.purchase-price button').trigger('click');
	});
	await Promise.all(promises);
}

function sebes() {
	$('<a id="sebes">Посчитать по себесу</a>').on('click', e => {
		e.preventDefault();
		$('#order-list .order-products-tbody').each((_, product) => {
			const $product = $(product);
			$product.find('.order-price__initial-price__input').val($product.find('.wholesale-price__input').val()).change();
			$product.find('.order-price__apply').trigger('click');
		});
	}).prependTo($('#order-list .order-row__top:first-child'));
}

function dostavkaPrice() {
	if ($('#delivery-cost').val() == '0,00') $('#order-delivery-cost__link-cost-manual').trigger('click');
	if ($('#delivery-net-cost').val() == '0,00') $('#order-delivery-net-cost__link-cost-manual').trigger('click');
}

async function properties() {
	const promises = $('#order-products-table tbody').toArray().map(async (product) => {
		const $product = $(product);
		if (!$product.is('.catalog')) return;

		const tr = $product.children('tr');
		const productId = tr.attr('data-product-id');
		const productIndex = tr.attr('data-order-product-index');
		const productTitle = $product.find('.title a').text().trim();
		const block = $product.find('td.properties-td');

		//проверям, есть ли у товара все поля
		if (![
			$product.find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_for-mat_value`).length,
			$product.find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_artikul_value`).length,
			$product.find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_tsena_value`).length
		].includes(0)) return;

		let index = $product.find('.order-product-properties > span').length;

		//если нет артикула или цены, нужно запрашивать у срм товар
		const productCrm = await retailcrm.get.product.byId(productId);
		//формат (for-mat)
		if (!$product.find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_for-mat_value`).length) {
			index++;
			let value = $product.find('.title a').text();
			if (productCrm.offers.length > 1) value = value.split(' - ').pop();
			addPproperty('for-mat', 'фор мат', value, index, productIndex, block);
		}
		//артикул (artikul)
		if (!$product.find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_artikul_value`).length) {
			index++;
			addPproperty('artikul', 'артикул', productCrm.offers.filter(offer => offer.name == productTitle)[0]['article'], index, productIndex, block);
		}
		//цена (tsena)
		if (!$product.find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_tsena_value`).length) {
			index++;
			addPproperty('tsena', 'цена', productCrm.offers.filter(offer => offer.name == productTitle)[0]['price'], index, productIndex, block);
		}

	});
	await Promise.all(promises);

	function addPproperty(code, name, value, index, productIndex, block) {
		//code - код опции (for-mat)
		//title - транслитерация field (фор мат)
		//value - значение
		//index - порядковый номер опции
		//productIndex - какой-то непонятный индекс, который создает сама срм (как  понимаю, это идентификатор товара в плане за все время)
		//block - родительский объект, к которому крепим

		//невидимое
		$(`
		<div data-index="${index}" class="order-product-property-hidden" style="display:none">
			<div class="property-field-code">
				<input type="hidden" id="intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_${code}_code" name="intaro_crmbundle_ordertype[orderProducts][${productIndex}][properties][${code}][code]" autocomplete="disabled" value="${code}">
			</div>
			<div class="property-field-name">
				<div class="value">
					<input type="text" id="intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_${code}_name" name="intaro_crmbundle_ordertype[orderProducts][${productIndex}][properties][${code}][name]" required="required" autocomplete="disabled" value="${name}">
				</div>
			</div>
			<div class="property-field-value">
				<div class="value">
					<input type="text" id="intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_${code}_value" name="intaro_crmbundle_ordertype[orderProducts][${productIndex}][properties][${code}][value]" required="required" autocomplete="disabled" value="${value}">
				</div>
			</div>
		</div>`).appendTo(block);

		//видимое
		$(`
		<span class="additional ellipsis edit" data-index="${index}" title="${name}: ${value}">
			<span>${name}</span>
			${value}
    	</span>`).appendTo(block.find('.order-product-properties'));
	}
}

//считаем расход денег на закуп цветков и остального
async function rashod() {
	noFlowers.set(await retailcrm.get.products.noFlowers());
	let oldSum;
	let newSum;
	//как бы сильно мне не хотелось использовать mutationObserver, конкретно тут он не работает
	const int = setInterval(() => {
		if (!$('#order-total-summ').length) {
			clearInterval(int);
			return;
		}
		newSum = $('#order-total-summ').text();
		if (newSum === oldSum) return;
		oldSum = newSum;
		rashodNoFlowers();
		calculator();
	}, 500);
}

//определяем расход на цветок и нецветок
function rashodNoFlowers() {
	money.flowers = 0;
	money.noFlowers = 0;
	$('#order-products-table tbody').each((_, product) => {
		const $product = $(product);
		const productTitle = $product.find('.title a').text();
		const productMoney = normalize.int($product.find('.order-price__initial-price__current').val()) * normalize.int($product.find('.quantity input').val());
		$product.addClass(noFlowers.get().includes(productTitle) || $product.is('.catalog') ? 'noFlower' : 'flower');
		if ($product.is('.flower')) {
			money.flowers += productMoney;
		} else {
			money.noFlowers += productMoney;
		}
	});

	$('#order-list .flowerNoFlower').remove();
	$(`
		<li class="order-table-footer__list-item flowerNoFlower">
			<p class="order-table-footer__text order-table-footer__text_muted order-table-footer__text_full">Стоимость закупа (цветок / нецветок)</p>
			<p class="order-table-footer__text order-table-footer__text_price">
				<span id="flowersRashodValue"></span>&nbsp;<span class="currency-symbol rub">₽</span> / 
				<span id="noflowersRashodValue"></span>&nbsp;<span class="currency-symbol rub">₽</span>
			</p>
		</li>`).prependTo('#order-list .order-table-footer__list');

	$('#flowersRashodValue').text(money.flowers);
	$('#noflowersRashodValue').text(money.noFlowers);
	const inputFlowers = $('#intaro_crmbundle_ordertype_customFields_flower_rashod');
	const inputNoFlowers = $('#intaro_crmbundle_ordertype_customFields_noflower_rashod');
	inputFlowers.parent().hide();
	inputNoFlowers.parent().hide();
	if (inputFlowers.val() == money.flowers && inputNoFlowers.val() == money.noFlowers) return;
	inputFlowers.val(money.flowers);
	inputNoFlowers.val(money.noFlowers);
}

//калькулятор в попапе
export function calculator() {
	setCurrentMoney();
	setPayedMoney();
	setDostavkaMoney();
	setTotalMoney();

	const remaining = money.total - money.current;
	const moneyProducts = money.current - money.dostavka;
	let output = '';
	output += moneyProducts;
	output += money.dostavka ? ` + <small>доставка:</small> ${money.dostavka}` : '';
	output += ` <small>из</small> ${money.total}`;
	output += ` (${remaining ? `<small>свободно:</small> <b>${remaining}</b> ₽` : '<b>ok</b>'})`;
	output += ` / <small>оплачено:</small> ${money.paid} ₽`;

	$('#popupCalculator').html(output);

	function setCurrentMoney() {
		//сколько пока набрано денег
		money.current = normalize.int($('#order-total-summ').text());
	}
	function setPayedMoney() {
		//сколько оплачено денег
		money.paid = 0;
		const payments = $('[id$="amount_text"][id^="intaro_crmbundle_ordertype_payments"]');
		payments.each((_, payment) => {
			const $payment = $(payment);
			if ($payment.parents('.payment__content-wrapper').children('.input-group').eq(0).find('[id$="status_chosen"] a span').text() != 'Оплачен') return;
			money.paid += normalize.int($payment.text());
		});
	}
	function setDostavkaMoney() {
		//стоимость доставки
		money.dostavka = parseFloat($('#delivery-cost').val().replace(',', '.'));
	}
	function setTotalMoney() {
		//сколько стоят все каталожные товары
		money.total = 0;
		if ($('#order-products-table tbody.catalog').length) {
			//считаем по значениям проперти "цена"
			$('#order-products-table tbody.catalog').each((_, product) => {
				money.total += parseFloat($(product).find('[id$="properties_tsena_value"]').val());
			});
		} else {
			//смотрим на оплаты
			money.total = money.paid;
		}
	}
}

//доступные остатки
function availableInventory() {
	$('.available-inventory-row').each((_, e) => {
		const $e = $(e);
		if ($e.find('.not-enough-to-reserve').length) $e.html('0');
		$e.html(`еще ${$e.text().replace(/\D/g, '')} шт`);
	});
}



function getProductId($product) {
	return $product.children().attr('data-product-id');
}