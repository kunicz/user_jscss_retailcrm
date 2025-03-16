import couriers from '@src/pages/couriers.mjs';
import courier from '@src/pages/courier.mjs';
import customer from '@src/pages/customer.mjs';
import orders from '@src/pages/orders.mjs';
import order from '@src/pages/order.mjs';
import products from '@src/pages/products.mjs';
import product from '@src/pages/product.mjs';

export { couriers, courier, customer, orders, order, products, product };
export const routes = new Map([
	['couriers', /admin\/couriers(?:[^\/]|$)/],
	['courier', /admin\/couriers\/(\d+|new)/],
	['customer', /customers\/\d+/],
	['orders', /orders\/$/],
	['order', /orders\/\d+/],
	['products', /products\/$/],
	['product', /products\/\d+/],
]); 