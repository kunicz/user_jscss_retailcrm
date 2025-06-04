import RootClass from '@helpers/root_class';
import dom from '@helpers/dom';
import '@css/popup.css';

export default class Popup extends RootClass {
	constructor() {
		super();
		this.el = null; // нода
	}

	// создает popup
	init() {
		this.el = dom(`
			<div id="custom_popup" data-page="" aria-hidden="false" aria-modal="true" role="dialog" class="popup_VIxGl omnica-modal" style="display:none">
				<div class="ps omnica-modal-window-container omnica-modal-window-container_responsive">
					<div class="omnica-modal-window omnica-modal-window_popup omnica-popper-container">
						<div class="omnica-modal-window__header">
							<div id="omnica-modal-window-title" class="omnica-modal-window__title">
								<div class="header_wXYN9">
									<div class="header__title_tGJJb" id="custom_popup__title"></div>
								</div>
							</div>
							<div aria-label="Esc" role="button" class="omnica-modal-window__close">
								<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="omnica-popper-target" style="width: 100%;"><path d="M7.113 6.176a.6.6 0 01.848 0L12 10.214l4.038-4.038a.6.6 0 01.849 0l.937.937a.6.6 0 010 .848L13.785 12l4.04 4.04a.6.6 0 010 .848l-.937.937a.6.6 0 01-.849 0L12 13.784l-4.038 4.04a.6.6 0 01-.849 0l-.937-.937a.6.6 0 010-.848l4.04-4.04-4.039-4.038a.6.6 0 010-.849l.937-.936z" fill="currentColor"></path></svg>
							</div>
						</div>
						<div class="omnica-modal-window__content">
							<div class="content_bh796">
								<div class="container_byENp" id="custom_popup__content"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`);
		this.el.data('class', this);
		this.el.lastTo('body');
		this.el.node('.omnica-modal-window__close').listen('click', () => this.el.hide());
	}

	// обновляет popup
	update(cls) {
		this.el.data('page', cls.id);
		this.el.data('сlass', cls);
		this.el.node('#custom_popup__title').text(cls.title);
		this.el.node('#custom_popup__content').empty();
		this.el.show();
	}

	// рендерит форму поиска
	static searchForm(placeholder) {
		return dom(`
			<form class="mr-6 product-popup__header-filter_RtttE" id="custom_popup__search_form">
				<div class="UiInput-ui-input-3K9r UiInput-ui-input_default-2XTS" style="width: 343px;">
					<div class="UiInput-input-3imQ UiInput-input_sm-3iUL">
						<input id="custom_popup__search_form_input" type="text" placeholder="${placeholder}" autocomplete="off" class="UiInput-input__area-2i6h" />
						<div aria-label="Clear button" class="UiInput-input__btn-clear-LQrA">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" title="" class="UiIcon-icon-2pR- UiIcon-icon_btn--HRx UiInput-input__icon-btn-clear-2IVE"><path d="M4 12a8 8 0 1116 0 8 8 0 01-16 0zm11 2.045c0-.122-.05-.24-.14-.324L13.148 12l1.712-1.721a.445.445 0 000-.648l-.49-.49a.444.444 0 00-.649 0L12 10.851 10.279 9.14a.444.444 0 00-.648 0l-.49.49a.444.444 0 000 .649L10.851 12 9.14 13.721a.444.444 0 000 .648l.49.49a.444.444 0 00.649 0L12 13.149l1.721 1.712a.444.444 0 00.648 0l.49-.49a.445.445 0 00.141-.325z"></path></svg>
						</div>
					</div>
				</div>
				<button id="custom_popup__search_form_btn" type="submit" class="ml-2 omnica-button omnica-button_secondary omnica-button_sm omnica-button_square omnica-button_default omnica-button_ellipsis">
					<span class="omnica-button__inner">
						<span class="omnica-button__icon">
							<svg><use xlink:href="/build/icons.5abc316b.svg#search"></use></svg>
						</span>
					</span>
				</button>
			</form>    
		`);
	}
}