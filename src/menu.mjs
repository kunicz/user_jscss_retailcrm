import { iconsSVG } from '@src/mappings';
import wait from '@helpers/wait';
import dom from '@helpers/dom';
import CouriersPopup from '@modules/popup/popup_couriers';
import '@css/menu.css';

// в феврале 2026 ЧТО-ТО ПОМЕНЯЛИ В ВЕРСТКЕ МЕНЮ, ИЗ-ЗА ЧЕГО ОНО НЕ ПРОГРУЖАЕТСЯ как надо
// и нормально не отрабатывает wait
// удалил все, что завязано на DOM

export default class Menu {
	constructor() {
		this.menu = dom('#nav-bar');
		this.CouriersPopup = new CouriersPopup();
	}

	async init() {
		// кнопка: курьеры
		//this.addButton(this.CouriersPopup.id, this.CouriersPopup.title, this.CouriersPopup.callback, this.navBarTop);
		// версия бандла
		this.addBundleVersion();
	}

	// добавляет кнопку в меню
	async addButton(id, title, callback, navBarSection, before = '') {
		const iconSelector = '.nav-btn';
		if (!await wait.element(iconSelector)) return;

		const dataVAttr = navBarSection.node(iconSelector).attributes;
		const v = [...dataVAttr].find(attr => attr.name.startsWith('data-v-'))?.name;
		const btn = dom(`
			<div data-menu-btn="${id}" aria-label="${title}" class="nav-btn nav-btn_tasks nav-btn_20" ${v}>
				<div class="nav-btn__inner" ${v}>
					<a href="javascript:void(0);" class="nav-btn__link" ${v}>
						<span class="nav-btn__icon nav-btn__icon_${id}" ${v}>${iconsSVG['menu_' + id] || ''}</span>
					</a>
					<div class="nav-btn__tooltip" ${v}>${title}</div>
					<div class="nav-btn__menu" ${v}></div>
				</div>
			</div>	
		`);

		btn.listen('click', callback);

		const beforeElement = before ? navBarSection.childs(`[data-menu-btn="${before}"]`) : null;
		beforeElement?.length ? btn.prevTo(beforeElement) : navBarSection.toLast(btn);
	}

	// добавляет версию в меню
	addBundleVersion() {
	}
}