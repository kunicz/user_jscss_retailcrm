/**
 * превращает объект в триггер, при наведении на который появляется тултип
 * использую css и js самой retailcrm
 * 
 * @param {jquery} $trigger - объект, к которому добавляется тултип 
 * @param {string} text - содердимое тултипа
 */
export function inlineTooltip($trigger, text) {
	$trigger.addClass('inline-tooltip-trigger');
	$trigger.after(`<div class="inline-tooltip inline-tooltip_normal user_jscss_tooltip">${text}</div>`);
}