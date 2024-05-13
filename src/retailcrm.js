import { API_RETAILCRM_SITE, API_RETAILCRM_TOKEN } from './env';

export async function getProductsNoFlowers() {
	console.log('getProductsNoFlowers');
	let response;
	const names = [];
	//получаем товары из остатков
	const groups = [
		'filter[groups][]=79', // декор
		'filter[groups][]=84' // упаковка
		// 'filter[groups][]=83', // сухоцветы
	];
	response = await fetch(`${API_RETAILCRM_SITE}/store/products?apiKey=${API_RETAILCRM_TOKEN}&limit=100&filter[sites][]=ostatki-msk&${groups.join('&')}`);
	response = await response.json();
	if (!response.success) {
		console.error('retailCRM error', response);
		return null;
	}
	if (!response.products.length) return null;
	names.push(...response.products.map(product => product.name));
	response.products.forEach(product => {
		names.push(...product.offers.map(offer => offer.name));
	});
	//получаем допники
	response = await fetch(`https://php.2steblya.ru/ajax.php?script=FromDB&request=dopniki`);
	response = await response.json();
	if (!response.success) {
		console.error('retailCRM error', response);
		return null;
	}
	names.push(...response.response.map(product => product.title));
	return [...new Set(names)];
}

export async function getProductById(id, site) {
	const response = await fetch(`${API_RETAILCRM_SITE}/store/products?apiKey=${API_RETAILCRM_TOKEN}&limit=100&filter[sites][]=${site}&filter[ids][]=${id}`);
	const responseData = await response.json();
	if (!responseData.success) {
		console.error('retailCRM error', responseData);
		return null;
	}
	if (!responseData.products.length) return null;
	return responseData.products.length ? responseData.products[0] : null;
}

export async function getSiteByName(name) {
	const response = await fetch(`${API_RETAILCRM_SITE}/reference/sites?apiKey=${API_RETAILCRM_TOKEN}`);
	const responseData = await response.json();
	if (!responseData.success) {
		console.error('retailCRM error', responseData);
		return null;
	}
	const site = Object.values(responseData.sites).filter(site => site.name == name);
	return site.length ? site[0] : null;
}

export async function getCustomerById(id) {
	const response = await fetch(`${API_RETAILCRM_SITE}/customers?apiKey=${API_RETAILCRM_TOKEN}&filter[ids][]=${id}`);
	const responseData = await response.json();
	if (!responseData.success) {
		console.error('retailCRM error', responseData);
		return null;
	}
	return responseData.customers.length ? responseData.customers[0] : null;
}