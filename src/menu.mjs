import { iconsSVG } from '@src/mappings';
import BundleLoader from '@bundle_loader';
import wait from '@helpers/wait';
import CouriersPopup from '@modules/popup/popup_couriers';
import '@css/menu.css';

export default class Menu {
	constructor() {
		this.$navBar = $('#nav-bar .bar__inner');
		this.$navBarTop = this.$navBar.children().eq(0);
		this.$navBarBottom = this.$navBar.children().eq(1);
		this.couriersMeta = new CouriersPopup().meta;
	}

	init() {
		BundleLoader.version().insertAfter(this.$navBar.find('[data-menu-btn="profile"]'));
		this.addButton(this.couriersMeta, this.$navBarTop);
	}

	// добавляет кнопку в меню
	async addButton({ id, title, callback }, $block, before = '') {
		if (!await wait.element('.nav-btn__icon')) return;

		const dataVAttr = $block.find('.nav-btn__icon')[0].attributes;
		const v = [...dataVAttr].find(attr => attr.name.startsWith('data-v-'))?.name;
		const btn = $(`
			<div data-menu-btn="${id}" aria-label="${title}" class="nav-btn nav-btn_tasks nav-btn_20" ${v}>
				<div class="nav-btn__inner" ${v}>
					<a href="javascript:void(0);" class="nav-btn__link" ${v}>
						<span class="nav-btn__icon nav-btn__icon_${id}" ${v}>
							${iconsSVG['menu_' + id] || ''}
						</span>
					</a>
					<div class="nav-btn__tooltip" ${v}>${title}</div>
					<div class="nav-btn__menu" ${v}></div>
				</div>
			</div>	
		`);

		btn.on('click', callback);

		const $beforeElement = before ? $block.children(`[data-menu-btn="${before}"]`) : null;
		$beforeElement?.length ? btn.insertBefore($beforeElement) : $block.append(btn);
	}
}

