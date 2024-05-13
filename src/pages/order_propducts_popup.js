import '../css/order_products_popup.css';

export function popup() {
	button();
	offers();
	calculatorPlaceholder();
	listen();
}

function button() {
	//скрываем кнопку, если нет магазина и менеджера
	const int = setInterval(() => {
		if (!$('#add-order-product-btn').length) {
			clearInterval(int);
			return;
		}
		const conditions = [
			!$('#intaro_crmbundle_ordertype_manager').val(),
			!$('#intaro_crmbundle_ordertype_site').val(),
			!$('#intaro_crmbundle_ordertype_firstName').val()
		];
		$('#add-order-product-btn').parent().toggle(!conditions.includes(true));
	}, 500);
}

function listen() {
	new MutationObserver((mutationsList, observer) => {
		for (let mutation of mutationsList) {
			if (mutation.type !== 'childList') return;
			for (let addedNode of mutation.addedNodes) {
				//открывается попап
				if ($(addedNode).is('.stat-box-wrapper')) {
					stripPrice();
					defualtShop();
				}
				//товары без офферов
				if ($(addedNode).is('tr[data-product-id]:not(.has-children):not(.inside-headers)')) {
					priceAfterTitle($(addedNode));
				}
			}
		}
	}).observe(document.querySelector('#order-list .order-table-header'), { childList: true, subtree: true });
}

async function defualtShop() {
	//ставим дефолтный магазин "Остатки (город)"
	$('#CRMBundle_AddOrderProductPopupFilter_Type_site option').each((_, e) => {
		if (!$(e).text().startsWith('Остатки')) return;
		if ($(e).text().match(/Остатки \(([^)]+)\)/)[1] == $('#intaro_crmbundle_ordertype_manager_chosen').text()) {
			$(e).attr('selected', 'selected');
			$('#CRMBundle_AddOrderProductPopupFilter_Type_site').change();
		} else {
			//здесь надо будет написать удаление пунктов других городов
			//но возможно и не надо, если в настройках срм получится указать какой менеджер может работать с каким магазином
		}

	});
	//показываем правильные товары
	await new Promise(resolve => setTimeout(resolve, 1000));
	$('#order-product-popup input[value="Найти"]').trigger('click');
}

//обнуляем стоимость каталожных товаров (не допников)
function stripPrice() {
	$('#order-products-table .catalog:not(.dopnik)').find('input[id$="initialPrice"],[id$="order-price-dropdown"] .order-price__main input').val(0).change();
}

function offers() {
	$('body').on('click', '#order-product-popup tr.has-children', async (e) => {
		const parent = $(e.target.closest('tr'));
		if (!parent.is('.show')) return;
		await new Promise(resolve => setTimeout(resolve, 500));
		const offers = parent.next().siblings(`tr.is-child[data-product-id="${parent.attr('data-product-id')}"]`);
		orderASC(parent, offers);
	});

	function orderASC(parent, offers) {
		offers.get().sort((a, b) => {
			var keyA = parseInt($(a).attr('data-price').replace(/\.\d+/, ''));
			var keyB = parseInt($(b).attr('data-price').replace(/\.\d+/, ''));
			if (keyA < keyB) return 1;
			if (keyA > keyB) return -1;
			return 0;
		}).forEach(child => parent.next().after($(child)));
	}

}

function priceAfterTitle(offer) {
	if (offer.is('.priceAfterTitle')) return;
	const block = offer.find('td:nth-child(2) div');
	block.html(`${block.text()} / <b>${offer.find('.price-ins a').attr('data-value')} ₽</b>`);
	offer.addClass('priceAfterTitle');
}

function calculatorPlaceholder() {
	$('#order-product-popup h2').get(0).childNodes[0].remove();
	$('#order-product-popup h2').prepend(`<span id="popupCalculator"></span>`);
}