import App from '@src';
import Admin from './finances/admin.mjs';
import Manager from './finances/manager.mjs';

export default class Finances {
	init() {
		const module = App.user?.isAdmin ? Admin : Manager;
		new module().init();
	}
}

