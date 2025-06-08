import ProductsTable from '@modules/order/products/table';

export default ProductsTable;

/**
 * вынужденный уровень абстракции.
 * так как модуль order.mjs ожидает именно products.mjs, приходится проксировать
 * ведь для обработки DOM элементов используются модули table.mjs и row.mjs.
 */
