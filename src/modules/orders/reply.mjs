import dates from '@helpers/dates';

export default class Reply {
	constructor(row, data) {
		this.row = row;
		this.data = data;
		this.formalityLevel = row?.shopDb?.formality_level || 'вы';
		this.deliveryDate = dates.add(row.orderCrm.delivery.date);
		this.isSpecialDate = this.defineSpecialDate();
	}

	init() {
		return [
			this._order(),
			this._dostavka(),
			this._adres(),
			this._poluchatel(),
			this._photos(),
			this._thanks(),
		].filter(Boolean).join('\n\n');
	}

	defineSpecialDate() {
		return dates.special.some(date => date.d === this.deliveryDate.d && date.m === this.deliveryDate.m);
	}

	_order = () => {
		const data = {
			'ты': `📦 зоказек \*\*#${this.data.orderId}\*\* принят! проверь!`,
			'вы': `📦 ваш заказ \*\*#${this.data.orderId}\*\* принят! проверьте!`,
			'Вы': `📦 Ваш заказ \*\*#${this.data.orderId}\*\* принят! Проверьте!`
		}
		return data[this.formalityLevel] || '';
	}

	_dostavka = () => {
		if (!this.data.date) return '';

		let output = `📅 \*\* ${this.formalityLevel === 'Вы' ? 'Д' : 'д'}оставка\*\*:\n`;
		output += `${this.data.date}`;
		if (this.data.time) output += ` ${this.data.time}`;
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
		if (!this.data.adres) return '';

		let output = `🏠 \*\*${this.formalityLevel === 'Вы' ? 'П' : 'п'}о адресу\*\*:\n`;
		output += `${this.data.adres}`;
		if (this.data.domofon) output += `\nкод домофона: ${this.data.domofon}`;
		return output;
	}

	_poluchatel = () => {
		if (!this.data.name && !this.data.phone) return '';

		let output = `🙎 \*\*${this.formalityLevel === 'Вы' ? 'П' : 'п'}олучатель\*\*:\n`;
		if (this.data.name && this.data.phone) output += `${this.data.name} (${this.data.phone})`;
		else if (this.data.name) output += `${this.data.name}`;
		else if (this.data.phone) output += `(${this.data.phone})`;
		return output;
	};

	_photos = () => {
		const data = {
			special: {
				'ты': '⚠️ ну и эта - фот очки на праздники не присылаем',
				'вы': '⚠️ фотографии на праздники не присылаем (к сожалению, на это нет времени)',
				'Вы': '⚠️ Фотографии на праздники не присылаем (к сожалению, на это нет времени)',
			},
			common: {
				'ты': '📷 фото очка по готовности',
				'вы': '📷 фотографии букета по готовности',
				'Вы': '📷 Фотографии букета вышлем по готовности',
			}
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
