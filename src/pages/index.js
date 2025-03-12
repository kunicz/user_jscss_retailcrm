import couriers from '@src/pages/couriers';
import courier from '@src/pages/courier';
import customer from '@src/pages/customer';
import orders from '@src/pages/orders';
import order from '@src/pages/order';
import products from '@src/pages/products';
import product from '@src/pages/product';

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