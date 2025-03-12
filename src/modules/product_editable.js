import '../css/product_editable.css';
import wait from '@helpers/wait.js';

let blocks;

export default async () => {
	await wait.halfsec();
	blocks = $('.warehouse-product .UiTabs-tabs-item-lNPO');
	if (blocks.length < 4) return;

	blocksClasses();
	reorganizeBlocks();
	pricesInItems();
	background();
	toggleProperties();
	toggleBukets();
}

/* добавляем классы к основным блокам */
function blocksClasses() {
	blocks.each((i, block) => $(block).addClass('ostatki').attr(['main', 'properties', 'variants', 'amount'][i], true));
}

/* включаем цену в торговом приложении */
async function pricesInItems() {
	const initialPriceInput = $('.ostatki[properties] input[value="prices"]');
	const purchasePriceInput = $('.ostatki[properties] input[value="purchasePrice"]');
	if (initialPriceInput.is(':checked') && purchasePriceInput.is(':checked')) return;

	if (!initialPriceInput.is(':checked')) initialPriceInput.parents('label').trigger('click');
	await new Promise(resolve => setTimeout(resolve, 100));
	if (!purchasePriceInput.is(':checked')) purchasePriceInput.parents('label').trigger('click');
	await new Promise(resolve => setTimeout(resolve, 100));
	$('.ostatki[properties] .save-box button').trigger('click');
}

/* улучшаем блоки */
function reorganizeBlocks() {
	const rows = $('.ostatki[amount] .table > tbody > tr');
	for (let i = rows.length - 1; i >= 0; i--) {
		rows.eq(i).children('td:first').html($('.ostatki[variants] section').eq(i)); // переносим варианты товара в таблицу amount
		offerPrice(rows.eq(i), i);
		ostatkiAmountEnhanced(rows.eq(i));
	}
	orderVariantsASC();

	/* следим за добавлениями офферов */
	const rowsMutator = new MutationObserver((mutationsList, observer) => {
		if (!mutationsList[0].addedNodes.length) return;
		$(mutationsList[0].addedNodes[0]).children('td:first').html($('.ostatki[variants] section'));
		rowsMutator.disconnect();
		offerPrice($(mutationsList[0].addedNodes[0]));
		ostatkiAmountEnhanced($(mutationsList[0].addedNodes[0]));
		orderVariantsASC();
		listen();
	});

	/* следим за изменениями офферов */
	const offersMutator = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.addedNodes) {
				Array.from(mutation.addedNodes).forEach((node) => {
					if ($(node).is('.ostatki[amount] section button.omnica-button_primary')) {
						node.addEventListener('click', () => {
							offerChangedPrice($(node.closest('tr')));
							orderVariantsASC();
						});
					}
				});
			}
		});
	});

	listen();
	function listen() {
		rowsMutator.observe(document.querySelector('.ostatki[amount] tbody'), { childList: true, subtree: false });
		offersMutator.observe(document.body, { childList: true, subtree: true });
	}

	/* торговые предложения по алфавиту */
	function orderVariantsASC() {
		const sortedRows = $('.ostatki[amount] .table > tbody > tr').get().sort(function (a, b) {
			const keyA = parseFloat($(a).find('.offerPrice span.purchase').text());
			const keyB = parseFloat($(b).find('.offerPrice span.purchase').text());
			if (keyA < keyB) return -1;
			if (keyA > keyB) return 1;
			return 0;
		});
		$(sortedRows).each((_, row) => $(row).parent().append($(row)));
	}

	/* цены офферов */
	function offerPrice(row, i = $('.ostatki[amount] .table > tbody > tr').length - 1) {
		const prices = {
			initial: $('.ostatki[properties] tbody tr:nth-child(4)').children('td:nth-child(2)').text().split(', '),
			purchase: $('.ostatki[properties] tbody tr:nth-child(2)').children('td:nth-child(2)').text().split(', ')
		}
		appendOfferPrice(row, prices.initial[i], prices.purchase[i]);
	}
	function offerChangedPrice(row) {
		row.find('.offerPrice').remove();
		appendOfferPrice(row, row.find('form > div:last [name="product_offers_property"]').val(), row.find('form > div:last [name="product_purchase_price"]').val());
	}
	function appendOfferPrice(row, inintialPrice, purchasePrice) {
		row.find('.omnica-collapse-box__header-content > div > div').append(`<span class="offerPrice"> / <span class="purchase">${purchasePrice || 0}</span> ₽ в продаже / <span class="initial">${inintialPrice || 0}</span> ₽ в закупе</span>`);
	}

	/* улучшаем таблицу "остатки" */
	function ostatkiAmountEnhanced(row) {
		const input = row.find('.table__warehouse-data input[type="text"]');
		//показываем подсказку "сколько было" до изменения
		input.parent().after($(`<span class="plusMinusChangedInfo">Было: <span class="oldVal">${parseInt(input.val())}</span></span>`));
		//очищаем инпут на фокусе
		input.on('focus', () => input.val(''));
		/*
		//добавляем кнопки плюс/минус
		const btn = $('<div class="plusMinusBtn"></div>');
		const plusBtn = btn.clone();
		plusBtn.addClass('plus').text('+').insertAfter(input.parent()).on('click', () => {
			input.val(parseFloat(input.val()) + 1).trigger('input');
		});
		const minusBtn = btn.clone();
		minusBtn.addClass('minus').text('-').insertBefore(input.parent()).on('click', () => {
			input.val(parseFloat(input.val()) - 1).trigger('input');
		});
		/*$('.ostatki[amount] .save-box button').on('click', () => {
			inputs.each((_,e) => input.parent().next('.plusMinusChangedInfo').children('.oldVal').text(input.val()));
		});*/
	}
}

function background() {
	$('.inner-wrapper__content, .bg').css('background-color', '#fff');
	$('.save-box').css({ position: 'relative', left: 'auto', bottom: 'auto' });
	$('.save-box.wrapper').css({ border: '0 none', padding: '15px 0 10px 13px', 'margin-top': '10px' });
}

/**
 * показать/скрыть настройки цен
 */
function toggleProperties() {
	let prices = false;
	$('<a id="toggleProperties"></a>').text(togglePropertiesText()).on('click', e => {
		prices = !prices;
		$(e.target).text(togglePropertiesText());
		$('.ostatki[properties]').toggle();
	}).insertAfter('.ostatki[variants] button.omnica-button_primary');

	function togglePropertiesText() {
		return prices ? 'скрыть цены' : 'включить цены';
	}
}

/**
 * включить/отключить букеты с этим цветком на сайтах
 */
async function toggleBukets() {
	let title = $('.section-head__title').text().trim();
	const response = await fetch('https://php.2steblya.ru/ajax.php?script=FromDB&request=flower&title=' + title);
	const fromDB = await response.json();
	if (!fromDB.success) return;
	if (!fromDB.response.length) return;
	console.log(fromDB.response[0]);
}