import { isPage } from './index';
import { product as product_editable } from './modules/product_editable';
//import { product as product_not_editable } from './product_not_editable';

export function product() {
	if (!isPage('products\/\\d+')) return;

	if ($('body').is('.responsive-form')) {
		//console.log('user_jscss : product_not_editable');
		//product_not_editable();

	} else {
		console.log('user_jscss : product_editable');
		product_editable();
	}
}