import { md5today } from '../helpers';
import '../css/menu.css';

export async function menu() {
	setTimeout(() => {
		if (!$('#nav-bar').length) {
			menu();
			return;
		}
		couriersLink();
		analyticsBtnMoveDown();
		buyTodayLinks();
	}, 500);
}

function couriersLink() {
	setTimeout(() => {
		$(`
		<div data-v-4cbeb000="" data-v-0c31c4ee="" data-menu-btn="couriers" class="nav-btn nav-btn_tasks" data-view-mode="">
			<div data-v-4cbeb000="" class="nav-btn__inner">
				<a data-v-4cbeb000="" href="/admin/couriers/" class="nav-btn__link">
					<span data-v-4cbeb000="" class="nav-btn__icon nav-btn__icon_couriers"></span>
				</a>
				<div data-v-4cbeb000="" class="nav-btn__tooltip">Курьеры</div>
				<div data-v-4cbeb000="" class="nav-btn__menu"></div>
			</div>
		</div>`).appendTo('#nav-bar .bar__col:first');
	}, 500);
}

function analyticsBtnMoveDown() {
	const a = $('.nav-btn_analytics');
	a.insertAfter(a.siblings(':last'));
}

function buyTodayLinks() {

	add();
	resetAtMidnight();

	function resetAtMidnight() {
		const now = new Date();
		const timeUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;
		setTimeout(function () {
			remove();
			add();
			resetAtMidnight();
		}, timeUntilMidnight);
	}

	async function add() {
		const response = await fetch('https://php.2steblya.ru/ajax.php?script=FromDB&request=shops');
		const fromDB = await response.json();
		if (!fromDB.success) return;
		const cont = $(`
		<div id="buyTodayLinks">
			<p class="title">Продажа на сегодня</p>
			<p><small>клик по ссылке и ctrl+v в меccенджере с заказчиком</small></p>
		</div>`);
		const today = md5today();
		fromDB.response.forEach(shop => {
			$(`<div data-v-a5f708be="" data-v-066aed4d="" class="ql-item" id="18">
			<div data-v-a5f708be="" class="ql-item__row">
				<div data-v-a5f708be="" class="ql-item__icon-wrap handle">
					<svg data-v-a5f708be="" class="svg-icon ql-item__icon ql-item__icon_drag">
						<use data-v-a5f708be="" xlink:href="/build/icons.3927a69d.svg#drag"></use>
					</svg>
					<svg data-v-a5f708be="" class="svg-icon ql-item__icon ql-item__icon_open">
						<use data-v-a5f708be="" xlink:href="/build/icons.3927a69d.svg#open_in_new"></use>
					</svg>
				</div>
				<a data-v-a5f708be="" href="https://${shop.shop_site}?buytoday=${today.hash}" target="_blank" class="ql-item__link">${shop.shop_site}</a>
			</div>
		</div>
		`).appendTo(cont).on('click', function (e) {
				e.preventDefault();
				navigator.clipboard.writeText($(this).find('.ql-item__link').attr('href'));
			});
		});
		cont.append(`
		<div data-v-1f69f94c="" data-v-066aed4d="" class="ql-item todayDate">
			<p>сегодня: ${today.string}</p>
		</div>`).insertBefore($('.quick-links__add'));
	};
	function remove() {
		$('#buyTodayLinks').remove();
	};
}

