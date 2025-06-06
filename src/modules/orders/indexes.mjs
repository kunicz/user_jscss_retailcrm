import hash from '@helpers/hash';

// массив объектов данных о столбцах таблицы
// index - порядковый номер,
// title - русский текст,
// slug - английский код,
// hidden - boolean - скрыть столбец или нет
export const indexes = [];

export function buildIndexes(ths) {
	ths.forEach((th, i) => {
		const data = {};
		data.index = i;
		data.title = th.txt()
			.replace(/\s+/g, ' ')  // заменяем все пробельные символы на один пробел
			.replace(/\n/g, '')    // удаляем переносы строк
			.trim()                // удаляем пробелы в начале и конце
			.toLowerCase();        // приводим к нижнему регистру
		data.slug = getSlug(data.title);
		indexes.push(data);
	});
}

function getSlug(title) {
	if (title === 'выделить все заказы на странице выделить все заказы в списке') return 'checkbox';
	if (title === 'магазин') return 'shop';
	if (title === 'дата и время') return 'created';
	if (title === 'дата доставки') return 'date';
	if (title === 'время доставки') return 'time';
	if (title === 'покупатель') return 'zakazchik';
	if (title === 'букеты в заказе') return 'products';
	if (title === 'выебри карточку') return 'card';
	if (title === 'комментарий клиента') return 'comments';
	if (title === 'статус заказа') return 'status';
	if (title === 'сумма') return 'summ';
	if (title === 'оплата') return 'payment';
	if (title === 'стоимость доставки') return 'cost';
	if (title === 'адрес доставки') return 'adres';
	if (title === 'флорист') return 'florist';
	if (title === 'курьер') return 'courier';
	if (title === 'откуда узнал о нас (в заказе)') return 'uznal';
	return hash.string(title);
}