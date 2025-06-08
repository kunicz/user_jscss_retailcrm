import retailcrm from '@helpers/retailcrm_direct';
import db from '@helpers/db';
import { php2steblya } from '@helpers/api';

// получает текущего пользователя crm
export async function getCrmUser(id) {
	const response = await retailcrm.get.user.byId(id);
	return response;
}

// получает данные заказа из crm по id заказа
export async function getCrmOrder(id) {
	const response = await retailcrm.get.order.byId(id);
	return response;
}

// получает данные товара из crm по id товара
export async function getCrmProduct(id) {
	const response = await retailcrm.get.products({
		filter: {
			ids: [id]
		}
	});
	return response?.[0];
}

// получает данные товара из db по id товара
// id - это externalId из Тильдя (можно взять в api retailcrm)
export async function getDbProduct(id, shopCrmId) {
	const response = await db.table('products').get({
		where: {
			id: id,
			shop_crm_id: shopCrmId
		},
		limit: 1
	});
	return response;
}

// получает данные товара/заказа из моего склада по id товара
export async function getMsProduct(id) {
	const data = { filter: { externalCode: id } };
	const response = await php2steblya('Moysklad', 'orders/get').fetch(data);
	return response?.rows[0];
}