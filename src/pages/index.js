import { default as couriers } from './couriers.js';
import { default as courier } from './courier.js';
import { default as customer } from './customer.js';
import { default as orders } from './orders.js';
import { default as order } from './order.js';
import { default as products } from './products.js';
import { default as product } from './product.js';

export { couriers, courier, customer, orders, order, products, product };
export const routes = new Map([
	['couriers', /admin\/couriers(?:[^\/]|$)/],
	['courier', /admin\/couriers\/(\\d+|new)/],
	['customer', /customers\/\\d+/],
	['orders', /orders\/$/],
	['order', /orders\/\d+/],
	['products', /products\/$/],
	['product', /products\/\d+/],
]); 