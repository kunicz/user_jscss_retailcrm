// превращает объект в триггер, при наведении на который появляется тултип
// использую css и js самой retailcrm
export function inlineTooltip(el, text) {
	el
		.addClass('inline-tooltip-trigger')
		.toNext(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip">${text}</div>`);
}