import RootClass from '@helpers/root_class';
import dates from '@helpers/dates';
import { shops } from '@src/mappings';
import { ARTIKUL_TRANSPORT } from '@root/config';

export default class TelegramReply extends RootClass {
	constructor(crm) {
		super();

		this.id = crm.id;
		this.deliveryDate = dates.create(crm.delivery.date);
		this.isSpecialDate = this.defineSpecialDate();
		this.date = this.deliveryDate?.strRu;
		this.timeFrom = crm.delivery.time?.from;
		this.timeTo = crm.delivery.time?.to;
		this.time = this.timeFrom === this.timeTo ? this.timeFrom : `с ${this.timeFrom} до ${this.timeTo}`;
		this.adres = crm.delivery.address?.text;
		this.phoneP = crm.customFields?.phone_poluchatelya;
		this.nameP = crm.customFields?.name_poluchatelya;
		this.domofon = crm.customFields?.domofon;
		this.products = crm.items?.filter(p => p.offer?.article && p.offer.article != ARTIKUL_TRANSPORT);
		this.formalityLevel = shops.find(s => s.shop_crm_code === crm.site)?.formality_level || 'вы';
	}

	init() {
		return [
			this._order(),
			this._products(),
			this._dostavka(),
			this._adres(),
			this._poluchatel(),
			this._photos(),
			this._thanks(),
		].filter(Boolean).join('\n\n');
	}

	defineSpecialDate() {
		return dates.special.some(date => date.d === this.deliveryDate?.d && date.m === this.deliveryDate?.m);
	}

	_order = () => {
		const data = {
			'ты': `📦 зоказек ${b('#' + this.id)} принят! проверь!`,
			'вы': `📦 ваш заказ ${b('#' + this.id)} принят! проверьте!`,
			'Вы': `📦 Ваш заказ ${b('#' + this.id)} принят! Проверьте!`
		}
		return data[this.formalityLevel] || '';
	}

	_products = () => {
		if (!this.products?.length) return '';

		const title = this.formalityLevel === 'Вы' ? 'Товары' : 'товары';
		let output = `🌸 ${b(title)}:\n`;
		output += this.products.map(p => p.offer.displayName).join('\n');
		return output;
	}

	_dostavka = () => {
		if (!this?.date) return '';

		const title = this.formalityLevel === 'Вы' ? 'Доставка' : 'доставка';
		let output = `📅 ${b(title)}:\n`;
		output += `${this.date}`;
		if (this.time) output += ` ${this.time}`;
		return output + this._dateTimeComment();
	}

	_dateTimeComment = () => {
		const data = {
			special: {
				'ты': '\nименно в интервале! в какое точно время - босх его знает, курьер поедет по маршруту',
				'вы': '\nименно в интервале! в какое точно время - сказать не можем, курьер поедет по маршруту',
				'Вы': '\nИменно в интервале! В какое точно время - сказать не можем, курьер поедет по маршруту',
			},
			common: {}
		}
		return data[this.isSpecialDate ? 'special' : 'common']?.[this.formalityLevel] || '';
	}

	_adres = () => {
		if (!this?.adres) return '';

		const title = this.formalityLevel === 'Вы' ? 'По адресу' : 'по адресу';
		let output = `🏠 ${b(title)}:\n`;
		output += `${this.adres}`;
		if (this.domofon) output += `\nкод домофона: ${this.domofon}`;
		return output;
	}

	_poluchatel = () => {
		if (!this?.nameP && !this?.phoneP) return '';

		const title = this.formalityLevel === 'Вы' ? 'Получатель' : 'получатель';
		let output = `🙎 ${b(title)}:\n`;
		if (this.nameP && this.phoneP) output += `${this.nameP} (${this.phoneP})`;
		else if (this.nameP) output += `${this.nameP}`;
		else if (this.phoneP) output += `(${this.phoneP})`;
		return output;
	};

	_photos = () => {
		const data = {
			special: {
				'ты': '⚠️ ну и эта - фот очки на праздники не присылаем',
				'вы': '⚠️ фотографии на праздники не присылаем (к сожалению, на это нет времени)',
				'Вы': '⚠️ Фотографии на праздники не присылаем (к сожалению, на это нет времени)',
			},
			common: {}
			/*common: {
				'ты': '📷 фото очка по готовности',
				'вы': '📷 фотографии букета по готовности',
				'Вы': '📷 Фотографии букета вышлем по готовности',
			}*/
		}
		return data[this.isSpecialDate ? 'special' : 'common'][this.formalityLevel] || '';
	};

	_thanks = (o) => {
		const data = {
			'ты': '💋 чмоки! пасиба за зоказек!',
			'вы': '🙏 спасибо за заказ!',
			'Вы': '🙏 Спасибо за заказ!',
		}
		return data[this.formalityLevel] || '';
	}
}

// жирный текст для телеграмм (markdown v2)
function b(str) { return `\*\*${str}\*\*`; }
