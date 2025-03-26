import productsPopup from '@modules/order/products/popup';
import { properties } from '@modules/order/products/properties';
import { vehicleFormats } from '@src/mappings';
import { noFlowers, getOrderId, getShopCode } from '@src/pages/order';
import db from '@helpers/db';
import dom from '@helpers/dom';
import retailcrm from '@helpers/retailcrm_direct';
import normalize from '@helpers/normalize';
import wait from '@helpers/wait';
import { php2steblya } from '@helpers/api';
import '@css/order_products.css';

let watcher = dom.watcher();
let $table;
const money = {
	flowers: 0, // закупочная стоимость цветов в заказе
	noFlowers: 0, //закупочная стоимость нецветов и допников в заказе
	zakup: 0, //реализационная стоимость цветов и нецветов в заказе
	dostavka: 0, //стоимость доставки
	total: 0, //стоимость каталожных товаров в заказе
	paid: 0, //сколько оплачено
	current: 0 //сколько потрачено над анный момент
}

export default async () => {
	$table = $('#order-products-table');
	listen();
	title();
	dostavkaPrice();
	hideInfiniteOstatki();
	await productsCatalog();
	sebes();
	productsPopup();
	availableInventory();
	orderASC();
	await addTransport();
	rashod();
}

function listen() {
	watcher
		.setType('both')
		.setTarget($table[0])
		.setSelector('tbody')
		.setCallback(async () => {
			hideInfiniteOstatki();
			await productsCatalog();
			availableInventory();
			orderASC();
			await addTransport();
		})
		.start();
}

async function productsCatalog() {
	let isAuto = false;
	const bukety = [];
	const cards = [];
	const $productsAll = $table.find('tbody');
	const productCrmIds = $.map($productsAll, product => getProductId($(product)));
	const productsCrm = await retailcrm.get.products({ filter: { ids: productCrmIds } });
	const productsCatalog = productsCrm.filter(product => product.url && !product.url.includes('transportirovochnoe'));
	const productsCatalogIds = productsCatalog.map(product => product.id);
	const $productsCatalog = $productsAll.filter((_, product) => productsCatalogIds.includes(getProductId($(product))));

	await Promise.all($productsCatalog.map((i, product) => {
		const $product = $(product);
		return (async () => {
			const productDb = await db.table('products').get({
				where: { id: productsCatalog[i].externalId, shop_crm_id: productsCatalog[i].catalogId },
				limit: 1
			});
			await classes($product, productDb);
			checkAuto($product);
			//checkBukety($product);
			//chaeckCards($product);
			dopnikPurchasePrice($product, productDb);
			properties($product);
		})();
	}));

	setAuto();
	setBukety();
	setCards();

	//определяем тип товаров (каталожный/с фоточкой и допник)
	async function classes($product, productDb) {
		if ($product.is('.catalog')) return;
		if (!$product.find('.image img').length) return;
		$product.addClass('catalog');
		if (productDb.type == 666) $product.addClass('podpiska');
		if (productDb.type == 888) $product.addClass('dopnik');
		if (productDb.type == 1111) $product.addClass('donat');
	}

	function checkAuto($product) {
		if (!$product.is('.catalog')) return;
		const format = $product.find('.order-product-properties > span[title^="фор"]');
		if (!format.length) return;
		const conditions = [
			$product.find('.title a') == 'БОЛЬШОЙ ДОБРЫЙ СЧАСТЛИВЫЙ МЕДВЕДЬ',
			vehicleFormats.includes($product.find('.order-product-properties > span[title^="фор"]').attr('title').split(": ")[1])
		];
		if (!conditions.includes(true)) return;
		$('#intaro_crmbundle_ordertype_customFields_auto_courier').prop('checked', true);
		isAuto = true;
	}
	function setAuto() {
		const $input = $('#intaro_crmbundle_ordertype_customFields_auto_courier');
		if ($input.prop('checked') === isAuto) return;
		$input.prop('checked', isAuto);
	}

	function checkBukety($product) {
		if (!$product.is('.catalog')) return;
		bukety.push(`${$product.find('.title a').text()} (${parseFloat($product.find('.quantity input').val())} шт)`);
	}
	function setBukety() {
		const $input = $('#intaro_crmbundle_ordertype_customFields_bukety_v_zakaze');
		$input.parent().hide();
		return;
		const value = bukety.join(',<br>');
		if ($input.val() === value) return;
		$input.val(value).change();
	}

	function chaeckCards($product) {
		if (!$product.is('.catalog')) return;
		const card = $product.find('.order-product-properties > span[title*="карточк"]');
		if (!card.length) return;
		cards.push(card.attr('title').split(": ")[1]);
	}
	function setCards() {
		//удаляем дубликаты
		//исхожу из того, что не бывает такого, что есть в одном заказе два букета и оба со своим текстом, причем разным
		//во всех остальных случаях, кажется, этого будет достаточно
		const $input = $('#intaro_crmbundle_ordertype_customFields_card');
		$input.parent().hide();
		return;
		const cardsUnique = [...new Set(cards)];
		if (!cardsUnique.length) return;
		const value = cardsUnique.length === 1 ? cardsUnique[0] : 'разные для букетов';
		if ($input.val() === value) return;
		$input.val(value);
	}

	async function dopnikPurchasePrice($product, productDb) {
		if (!$product.is('.dopnik')) return;
		const $input = $product.find('td.purchase-price input.purchase-price');
		if (parseInt(normalize.int($input.val()) > 0)) return;
		if ($input.val() == productDb.purchase_price) return;
		$input.val(productDb.purchase_price).change();
		$product.find('td.purchase-price button').trigger('click');
	}
}

function title() {
	$table.find('thead .title').text('Товар');
}

async function addTransport() {
	if (shouldSkipTransportAdd()) return;

	// сохраняем заказ и подготавливаем к добавлению транспорта
	await prepareForTransportAdd();

	try {
		await php2steblya('retailcrm/AddTransport').get({ id: getOrderId() });
		window.location.reload();
	} catch (error) {
		console.error('Ошибка добавления транспортировочного:', error);
		toggleFreeze(false);
		watcher.start();
	}

	function shouldSkipTransportAdd() {
		// проверяем наличие транспортировочного в заказе
		if ($('#order-products-table td.title a').filter((_, t) => $(t).text().trim() === 'Транспортировочное').length) return true;

		// проверяем наличие товаров с картинкой
		if (!$('#order-products-table .catalog').length) return true;

		// проверяем что есть не только допники/донаты
		const catalogItems = document.querySelectorAll('#order-products-table .catalog').length;
		const dopnikItems = document.querySelectorAll('#order-products-table .dopnik').length;
		const donatItems = document.querySelectorAll('#order-products-table .donat').length;
		if (catalogItems === dopnikItems + donatItems) return true;

		// проверяем назначен ли флорист
		if (!$('#intaro_crmbundle_ordertype_customFields_florist').val()) return true;

		return false;
	}

	async function prepareForTransportAdd() {
		$('#main button[type="submit"]').trigger('click');
		watcher.stop();
		await wait.sec();
		toggleFreeze(true);
	}

	function toggleFreeze(toggle = true) {
		$('body').css('opacity', toggle ? .2 : 1).attr('disabled', toggle);
	}
}

//в каждом товаре теперь есть информация о наличии остатков на складе
//скрываем для тех, у кого их бесконечно (транспортировочное, декор и пр.)
function hideInfiniteOstatki() {
	$table.find('[data-available-quantity]').each((_, e) => {
		const $e = $(e);
		if (parseInt($e.attr('data-available-quantity')) < 100) return;
		$e.parent().hide();
	});
}

function orderASC() {
	watcher.stop();

	// Создаём временные массивы для каждой группы товаров
	const catalogProducts = [];
	const dopnikProducts = [];
	const otherProducts = [];

	// Распределяем товары по группам
	$table.find('tbody').each((_, product) => {
		const $product = $(product);
		const title = $product.find('.title a').text();

		if ($product.is('.catalog')) {
			if ($product.is('.dopnik')) {
				dopnikProducts.push({ title, element: $product.detach() });
			} else {
				catalogProducts.push({ title, element: $product.detach() });
			}
		} else {
			otherProducts.push({ title, element: $product.detach() });
		}
	});

	// Сортируем каждую группу по алфавиту
	catalogProducts.sort((a, b) => a.title.localeCompare(b.title));
	dopnikProducts.sort((a, b) => a.title.localeCompare(b.title));
	otherProducts.sort((a, b) => a.title.localeCompare(b.title));

	// Добавляем обратно в таблицу в нужном порядке
	catalogProducts.forEach(item => $table.append(item.element));
	dopnikProducts.forEach(item => $table.append(item.element));
	otherProducts.forEach(item => $table.append(item.element));

	watcher.start();
}

function sebes() {
	$('<a id="sebes">Посчитать по себесу</a>').on('click', e => {
		e.preventDefault();
		$table.find('tbody').each((_, product) => {
			const $product = $(product);
			const $wholesalePrice = $product.find('.wholesale-price__input');
			$product.find('.order-price__initial-price__input').val($wholesalePrice.val()).change();
			$product.find('.order-price__apply').trigger('click');
		});
	}).prependTo($('#order-list .order-row__top:first-child'));
}

function dostavkaPrice() {
	if (!normalize.int($('#delivery-cost').val())) $('#order-delivery-cost__link-cost-manual').trigger('click');
	if (!normalize.int($('#delivery-net-cost').val())) $('#order-delivery-net-cost__link-cost-manual').trigger('click');
}

//считаем расход денег на закуп цветков и остального
async function rashod() {
	noFlowers = await retailcrm.get.products.noFlowers(getShopCode());
	let oldSum;
	let newSum;
	//как бы сильно мне не хотелось использовать mutationObserver, конкретно тут он не работает
	setInterval(() => {
		if (!$('#order-total-summ').length) return;
		newSum = $('#order-total-summ').text();
		if (!oldSum) oldSum = newSum;
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
		$product.addClass(noFlowers.includes(productTitle) || $product.is('.catalog') ? 'noFlower' : 'flower');
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
	const $inputFlowers = $('#intaro_crmbundle_ordertype_customFields_flower_rashod');
	const $inputNoFlowers = $('#intaro_crmbundle_ordertype_customFields_noflower_rashod');
	$inputFlowers.parent().hide();
	$inputNoFlowers.parent().hide();
	if ($inputFlowers.val() == money.flowers && $inputNoFlowers.val() == money.noFlowers) return;
	$inputFlowers.val(money.flowers);
	$inputNoFlowers.val(money.noFlowers);
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

export function getProductId($product) {
	return Number($product.children().attr('data-product-id'));
}