import RootClass from '@helpers/root_class';
import PopupProperties from '@modules/order/products/popup_properties';
import hash from '@helpers/hash';
import wait from '@helpers/wait';
import { intaro } from '@modules/order/sections';
import dom from '@helpers/dom';

export default class Properties extends RootClass {
	constructor(tr) {
		if (dom.isOrphan(tr)) return;
		super();
		this.tr = tr;
		this.crm = tr.crm;
		this.block = dom(tr.node('[data-type="item-property-list"] div[role="list"]'));
		this.currentProps = tr.getProperties();
	}

	init() {
		this.addMissingProperties();
	}

	// проверяет, необходимо ли добавлять проперти в каталожный товар
	// и если необходимо, то добавляет
	async addMissingProperties() {
		if (!this.tr.isCatalog()) return;

		const requiredPropsMap = [
			{
				code: 'for-mat',
				name: 'фор мат',
				value: (() => {
					let value = this.tr.getFullTitle();
					if (this.crm.offers.length > 1) value = value.split(' - ').pop();
					return value;
				})()
			},
			{
				code: 'sku',
				name: 'sku',
				value: this.crm.offers.find(offer => offer.name === this.tr.getFullTitle())?.article
			},
			{
				code: 'artikul',
				name: 'артикул',
				value: this.crm.offers.find(offer => offer.name === this.tr.getFullTitle())?.article.split('-')[0]
			},
			{
				code: 'tsena',
				name: 'цена',
				value: this.crm.offers.find(offer => offer.name === this.tr.getFullTitle())?.price
			},
			{
				code: 'moysklad-id',
				name: 'мойсклад id',
				value: hash.timestamp()
			}
		];


		// находим проперти, которых не хватает
		const existingCodes = this.currentProps.map(item => item.code);
		const missingProps = requiredPropsMap.filter(item => !existingCodes.includes(item.code));

		// мойсклад не для допников
		if (this.tr.isDopnik()) {
			const index = missingProps.findIndex(item => item.code === 'moysklad-id');
			if (index !== -1) missingProps.splice(index, 1);
		}

		if (missingProps.length === 0) return;

		// открываем окно пропертей
		const target = this.currentProps.length === 0 ? this.block.child('a') : this.block.child().child('a');
		target.trigger('click');
		// тут трюк с идентификатором не прокатывает
		// так как нет никакой связи между модальными окнами и товарами
		// поэтому ищем все, и берем последнее
		await wait.element('body > [id^="omnica-modal-window"]');
		const modal = dom.all('body > [id^="omnica-modal-window"]').at(-1);
		modal.addClass('loading');
		// тут костыль, т.к. иногда vue не успевает добавить в дом контейнер
		// поэтому пробуем скрыть, а если не получилось, то пробуем еще раз через пол-секунды
		modal.node('.omnica-popper-container')?.hide();
		await wait.halfsec();
		modal.node('.omnica-popper-container')?.hide();
		// добавляем проперти
		await new PopupProperties(modal).init().addProperties(missingProps);
	}
}
