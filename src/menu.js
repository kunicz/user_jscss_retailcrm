import { iconsSVG } from './mappings.js';
import wait from '@helpers/wait.js';
import couriers from './modules/popup_couriers.js';
import './css/menu.css';

const $navBar = $('#nav-bar .bar__inner');
const $navBarTop = $navBar.children().eq(0);
const $navBarBottom = $navBar.children().eq(1);

export default () => {
	addButton(couriers, $navBarTop);
	addVeriosn();
}

async function addButton({ id, title, callback }, $block, before = '') {
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

	if (before) {
		const $beforeElement = $block.children(`[data-menu-btn="${before}"]`);
		if ($beforeElement.length) {
			btn.insertBefore($beforeElement);
		} else {
			$block.append(btn);
		}
	} else {
		$block.append(btn);
	}
}

function addVeriosn() {
	$(`<div id="bundleVersion">${window.bundleVersion}</div>`).insertAfter($navBar.find('[data-menu-btn="profile"]'));
}
