import { popup } from "./order_propducts_popup";
import { vehicleFormats, iconsSVG } from "../helpers";
import { getProductById, getSiteByName, getProductsNoFlowers } from "../retailcrm";
import '../css/order_products.css';

let siteCode;
let noFlowers;
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
		await type();
		autoCouirer();
		productsSummary();
		purchaseDopnikPrice();
		properties();
		availableInventory();
		orderASC();
		addTransport();
	} catch (e) {
		throw e;
	}
});

export async function products() {
	try {
		listen();
		table();
		dostavkaPrice();
		hideInfiniteOstatki();
		siteCode = await getSiteCode();
		await type();
		popup();
		autoCouirer();
		cardSummary();
		productsSummary();
		purchaseDopnikPrice();
		properties();
		availableInventory();
		orderASC();
		addTransport();
		noFlowers = await getNoFlowers();
		rashod();
	} catch (e) {
		console.error(e);
		return;
	}
}
function listen() {
	observer.observe(document.querySelector('#order-products-table'), { childList: true, subtree: false });
}

function table() {
	$('#order-products-table thead .title').text('Товар');
}

//получаем код магазина
//понадобится для нахождения нужных пропертисов товаров
async function getSiteCode() {
	const site = await getSiteByName($('#intaro_crmbundle_ordertype_site_chosen').text());
	if (!site) return null;
	return site.code;
}

// получаем товары (не цветы) для проверки в составах заказов
// используется в функции rashod
async function getNoFlowers() {
	const noFlowers = await getProductsNoFlowers();
	return noFlowers || null;
}

//определяем тип товаров (каталожный/с фоточкой и допник)
async function type() {
	const promises = $('#order-products-table tbody').toArray().map(async (product) => {
		if ($(product).is('.catalog')) return;
		if (!$(product).find('.image img').length) return;
		$(product).addClass('catalog');
		try {
			const response = await fetch(`https://php.2steblya.ru/ajax.php?script=FromDB&request=type&id=${$(product).children().attr('data-product-id')}`);
			const fromDB = await response.json();
			if (!fromDB.success) return;
			if (!fromDB.response.length) return;
			if (fromDB.response[0].type != '888') return;
			$(product).addClass('dopnik');
		} catch (e) {
			throw e;
		}
	});
	await Promise.all(promises);
}

async function addTransport() {
	//Транспортировочное не нужно добавлять если:
	//1. в заказе уже есть транспортирочное
	const titles = document.querySelectorAll('#order-products-table td.title');
	for (let i = 0; i < titles.length; i++) {
		if (titles[i].innerText === 'Транспортировочное') return;
	}
	//2. в заказе нет товаров с картинкой (.catalog)
	if (!$('#order-products-table .catalog').length) return;

	//3. товары с картинкой это допники (.dopnik)
	if (document.querySelectorAll('#order-products-table .catalog').length == document.querySelectorAll('#order-products-table .dopnik').length) return;

	//сохраняем заказ
	$('body').css('opacity', .2).attr('disabled', true);
	$('#main button[type="submit"]').trigger('click');
	//ждем секунду, чтоб срм успела сохранить заказ
	await new Promise(resolve => setTimeout(resolve, 1000));
	//обновляем заказ + траснпортировочное кладется скриптом на сервере
	await fetch(`https://php.2steblya.ru/ajax.php?script=RetailCrm_add_transport&id=${$('.order-num').text().match(/\d+/)[0]}`);
	window.location.reload();
}

function hideInfiniteOstatki() {
	//в каждом товаре теперь есть информация о наличии остатков на складе
	//скрываем для тех, у кого их бесконечно (транспортировочное, декор и пр.)
	$('#order-products-table [data-available-quantity]').each((_, e) => {
		if (parseInt($(e).attr('data-available-quantity')) < 100) return;
		$(e).parent().hide();
	});
}

function orderASC() {
	observer.disconnect();
	const temp = {};
	const tempCatalog = {};
	const tempDopnik = {};
	$('#order-products-table tbody').each((_, product) => {
		if (!$(product).is('.catalog')) {
			temp[$(product).find('.title a').text()] = $(product).detach();
		} else {
			if ($(product).is('.dopnik')) {
				tempDopnik[$(product).find('.title a').text()] = $(product).detach();
			} else {
				tempCatalog[$(product).find('.title a').text()] = $(product).detach();
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
		if (!$(product).is('.catalog')) return;
		if (!$(product).find('.order-product-properties > span[title^="фор"]').length) return;
		if (![
			$(product).find('.title a') == 'БОЛЬШОЙ ДОБРЫЙ СЧАСТЛИВЫЙ МЕДВЕДЬ',
			vehicleFormats.includes($(product).find('.order-product-properties > span[title^="фор"]').attr('title').split(": ")[1])
		].includes(true)) return;
		$('#intaro_crmbundle_ordertype_customFields_auto_courier').prop('checked', true);
		return false;
	});
}

function cardSummary() {
	const summary = [];
	$('#order-products-table tbody').each((_, product) => {
		if (!$(product).is('.catalog')) return;
		if (!$(product).find('.order-product-properties > span[title*="карточк"]').length) return;
		summary.push($(product).find('.order-product-properties > span[title*="карточк"]').attr('title').split(": ")[1]);
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
		if (!$(product).is('.catalog')) return;
		summary.push(`${$(product).find('.title a').text()} (${parseFloat($(product).find('.quantity input').val())} шт)`);
	});
	const input = $('#intaro_crmbundle_ordertype_customFields_bukety_v_zakaze');
	const value = summary.join(',<br>');
	input.parent().hide();
	if (input.val() == value) return;
	input.val(value);
}

async function purchaseDopnikPrice() {
	const promises = $('#order-products-table tbody').toArray().map(async (product) => {
		if (!$(product).is('.dopnik')) return;
		const input = $(product).find('td.purchase-price input.purchase-price');
		if (parseInt(input.val() > 0)) return;
		try {
			const response = await fetch(`https://php.2steblya.ru/ajax.php?script=FromDB&request=purchase_price&id=${$(product).children().attr('data-product-id')}`);
			const fromDB = await response.json();
			if (!fromDB.success) return;
			if (!fromDB.response.length) return;
			if (!fromDB.response[0].purchase_price) return;
			if (parseInt(input.val()) == parseInt(fromDB.response[0].purchase_price)) return;
			input.val(parseInt(fromDB.response[0].purchase_price)).change();
			$(product).find('td.purchase-price button').trigger('click');
		} catch (e) {
			throw e;
		}
	});
	await Promise.all(promises);
}

function dostavkaPrice() {
	if ($('#delivery-cost').val() == '0,00') $('#order-delivery-cost__link-cost-manual').trigger('click');
	if ($('#delivery-net-cost').val() == '0,00') $('#order-delivery-net-cost__link-cost-manual').trigger('click');
}

async function properties() {
	const promises = $('#order-products-table tbody').toArray().map(async (product) => {
		if (!$(product).is('.catalog')) return;

		const tr = $(product).children('tr');
		const productId = tr.attr('data-product-id');
		const productIndex = tr.attr('data-order-product-index');
		const productTitle = $(product).find('.title a').text().trim();
		const block = $(product).find('td.properties-td');

		//проверям, есть ли у товара все поля
		if (![
			$(product).find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_for-mat_value`).length,
			$(product).find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_artikul_value`).length,
			$(product).find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_tsena_value`).length
		].includes(0)) return;

		let index = $(product).find('.order-product-properties > span').length;

		try {
			//если нет артикула или цены, нужно запрашивать у срм товар
			const productCrm = await getProductById(productId, siteCode);
			if (!productCrm) {
				throw new Error('product not found');
			} else {
				//формат (for-mat)
				if (!$(product).find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_for-mat_value`).length) {
					index++;
					let value = $(product).find('.title a').text();
					if (productCrm.offers.length > 1) value = value.split(' - ').pop();
					addPproperty('for-mat', 'фор мат', value, index, productIndex, block);
				}
				//артикул (artikul)
				if (!$(product).find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_artikul_value`).length) {
					index++;
					addPproperty('artikul', 'артикул', productCrm.offers.filter(offer => offer.name == productTitle)[0]['article'], index, productIndex, block);
				}
				//цена (tsena)
				if (!$(product).find(`#intaro_crmbundle_ordertype_orderProducts_${productIndex}_properties_tsena_value`).length) {
					index++;
					addPproperty('tsena', 'цена', productCrm.offers.filter(offer => offer.name == productTitle)[0]['price'], index, productIndex, block);
				}
			}
		} catch (e) {
			throw e;
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
function rashod() {
	if (!noFlowers) {
		$(`<li class="order-table-footer__list-item">${iconsSVG.warning}Не получены noFlowers. Сообщите администратору</li>`).prependTo('#order-list .order-table-footer__list');
		return;
	}
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
		flowersNoFlowers();
		calculator();
	}, 1000);

	//определяем расход на цветок и нецветок
	function flowersNoFlowers() {
		money.flowers = 0;
		money.noFlowers = 0;
		$('#order-products-table tbody').each((_, product) => {
			$(product).addClass(noFlowers.includes($(product).find('.title a').text().split(' - ')[0]) ? 'noFlower' : 'flower');
			if ($(product).is('.flower')) {
				money.flowers += parseFloat($(product).find('.purchase-price input').val().replace(',', '.')) * parseFloat($(product).find('.quantity input').val().replace(',', '.'));
			} else {
				money.noFlowers += parseFloat($(product).find('.purchase-price input').val().replace(',', '.')) * parseFloat($(product).find('.quantity input').val().replace(',', '.'));
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
	function calculator() {
		setCurrentMoney();
		setPayedMoney();
		setDostavkaMoney();
		setTotalMoney();

		let output = (money.current - money.dostavka);
		if (money.dostavka) output += ` + <small>доставка:</small> ${money.dostavka}`;
		output += ` <small>из</small> ${money.total}`;
		output += ` (${(!(money.total - money.current)) ? '<b>ok</b>' : '<small>свободно:</small> <b>' + (money.total - money.current) + '</b> ₽'})`;
		output += ` / <small>оплачено:</small> ${money.paid} ₽`;

		$('#popupCalculator').html(output);

		function setCurrentMoney() {
			//сколько пока набрано денег
			money.current = parseFloat($('#order-total-summ').text().replace(/[^\d,]/g, '').replace(',', '.'));
		}
		function setPayedMoney() {
			//сколько оплачено денег
			money.paid = 0;
			const payments = $('[id$="amount_text"][id^="intaro_crmbundle_ordertype_payments"]');
			payments.each((_, payment) => {
				if ($(payment).parents('.payment__content-wrapper').children('.input-group').eq(0).find('[id$="status_chosen"] a span').text() != 'Оплачен') return;
				money.paid += parseFloat($(payment).text().replace(/[^\d,]/g, '').replace(',', '.'));
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
				$('#order-products-table tbody.catalog').each((_, product) => money.total += parseFloat($(product).find('[id$="properties_tsena_value"]').val()));
			} else {
				//смотрим на оплаты
				money.total = money.paid;
			}
		}
	}
}

//доступные остатки
function availableInventory() {
	$('.available-inventory-row').each((_, e) => {
		if ($(e).find('.not-enough-to-reserve').length) $(e).html('0');
		$(e).html(`еще ${$(e).text().replace(/\D/g, '')} шт`);
	});
}