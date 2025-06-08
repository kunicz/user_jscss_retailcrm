import Comments from '@modules/order/sections/comments.mjs';
import Common from '@modules/order/sections/common.mjs';
import CustomFields from '@modules/order/sections/custom_fields.mjs';
import Dostavka from '@modules/order/sections/dostavka.mjs';
import Products from '@modules/order/sections/products.mjs';
import Zakazchik from '@modules/order/sections/zakazchik.mjs';

export const intaro = 'intaro_crmbundle_ordertype';

export default [
	Comments,
	Common,
	CustomFields,
	Dostavka,
	Zakazchik,
	Products,
];