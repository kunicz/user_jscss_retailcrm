import wait from '@helpers/wait';
import observers from '@helpers/observers';
import '@css/product_editable.css';

export default class ProductEditable {
	constructor() {
		this.blocks = [];
		this.$cont = $('#omnica-tab-group-1-touchstone');
		this.$tabBtns = this.$cont.find('[role="tab"]');
		this.observerRows = observers.add('product', 'rows');
		this.observerOffers = observers.add('product', 'offers');
	}

	async init() {
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

	destroy() {
		this.observerRows = null;
		this.observerOffers = null;
		this.blocks = null;
		$('.ostatki[amount] section button.omnica-button_primary').off();
	}

	// добавляем классы к основным блокам
	blocksClasses() {
		this.blocks.each((i, block) => $(block).addClass('ostatki').attr(['main', 'properties', 'variants', 'amount'][i], true));
	}

	// улучшаем блоки
	reorganizeBlocks() {
		const rows = $('.ostatki[amount] .table > tbody > tr');
		for (let i = rows.length - 1; i >= 0; i--) {
			rows.eq(i).children('td:first').html($('.ostatki[variants] section').eq(i)); // переносим варианты товара в таблицу amount
			this.offerPrice(rows.eq(i), i);
			this.ostatkiAmountEnhanced(rows.eq(i));
		}
		this.orderVariantsASC();
		this.listen();
	}

	// включаем цену в торговом приложении
	async pricesInItems() {
		const initialPriceInput = $('.ostatki[properties] input[value="prices"]');
		const purchasePriceInput = $('.ostatki[properties] input[value="purchasePrice"]');
		if (initialPriceInput.is(':checked') && purchasePriceInput.is(':checked')) return;

		if (!initialPriceInput.is(':checked')) initialPriceInput.parents('label').trigger('click');
		await wait.halfsec();
		if (!purchasePriceInput.is(':checked')) purchasePriceInput.parents('label').trigger('click');
		await wait.halfsec();
		$('.ostatki[properties] .save-box button').trigger('click');
	}

	// следим за добавлениями офферов
	listen() {
		this.observerRows
			.setTarget('.ostatki[amount] tbody')
			.setOptions({ subtree: false })
			.onAdded(row => {
				const $row = $(row);
				$row.children('td:first').html($('.ostatki[variants] section'));
				this.observerRows.stop();
				this.offerPrice($row);
				this.ostatkiAmountEnhanced($row);
				this.orderVariantsASC();
				this.observerRows.start();
			})
			.start();

		this.observerOffers
			.setSelector('.ostatki[amount] section button.omnica-button_primary')
			.setTarget('.ostatki[amount] tbody')
			.setOptions({ subtree: false })
			.onAdded(node => {
				const $node = $(node);
				$node.on('click', () => {
					this.offerChangedPrice($(node.closest('tr')));
					this.orderVariantsASC();
				});
			})
			.start();
	}

	// торговые предложения по алфавиту
	orderVariantsASC() {
		const sortedRows = $('.ostatki[amount] .table > tbody > tr').get().sort(function (a, b) {
			const keyA = parseFloat($(a).find('.offerPrice span.purchase').text());
			const keyB = parseFloat($(b).find('.offerPrice span.purchase').text());
			if (keyA < keyB) return -1;
			if (keyA > keyB) return 1;
			return 0;
		});
		$(sortedRows).each((_, row) => $(row).parent().append($(row)));
	}

	// цены офферов
	offerPrice(row, i = $('.ostatki[amount] .table > tbody > tr').length - 1) {
		const prices = {
			initial: $('.ostatki[properties] tbody tr:nth-child(4)').children('td:nth-child(2)').text().split(', '),
			purchase: $('.ostatki[properties] tbody tr:nth-child(2)').children('td:nth-child(2)').text().split(', ')
		}
		appendOfferPrice(row, prices.initial[i], prices.purchase[i]);
	}

	// изменение цены оффера
	offerChangedPrice(row) {
		row.find('.offerPrice').remove();
		appendOfferPrice(row, row.find('form > div:last [name="product_offers_property"]').val(), row.find('form > div:last [name="product_purchase_price"]').val());
	}

	// добавляем цену оффера
	appendOfferPrice(row, inintialPrice, purchasePrice) {
		row.find('.omnica-collapse-box__header-content > div > div').append(`<span class="offerPrice"> / <span class="purchase">${purchasePrice || 0}</span> ₽ в продаже / <span class="initial">${inintialPrice || 0}</span> ₽ в закупе</span>`);
	}

	// улучшаем таблицу "остатки"
	ostatkiAmountEnhanced(row) {
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

	// фон
	background() {
		$('.inner-wrapper__content, .bg').css('background-color', '#fff');
		$('.save-box').css({ position: 'relative', left: 'auto', bottom: 'auto' });
		$('.save-box.wrapper').css({ border: '0 none', padding: '15px 0 10px 13px', 'margin-top': '10px' });
	}

	// показать/скрыть настройки цен
	toggleProperties() {
		let prices = false;
		const toggle = () => prices ? 'скрыть цены' : 'включить цены';
		$('<a id="toggleProperties"></a>').text(toggle()).on('click', e => {
			prices = !prices;
			$(e.target).text(toggle());
			$('.ostatki[properties]').toggle();
		}).insertAfter('.ostatki[variants] button.omnica-button_primary');
	}

	// включить/отключить букеты с этим цветком на сайтах
	async toggleBukets() {
		let title = $('.section-head__title').text().trim();
		const response = await fetch('https://php.2steblya.ru/ajax.php?script=FromDB&request=flower&title=' + title);
		const fromDB = await response.json();
		if (!fromDB.success) return;
		if (!fromDB.response.length) return;
		console.log(fromDB.response[0]);
	}
}

