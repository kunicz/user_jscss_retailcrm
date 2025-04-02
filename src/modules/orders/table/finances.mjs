import { user } from '@src';
import financesAdmin from './finances/admin.mjs';
import financesManager from './finances/manager.mjs';

export default () => new Finances().init();

class Finances {
	init() {
		user?.isAdmin ? financesAdmin() : financesManager();
	}
}

