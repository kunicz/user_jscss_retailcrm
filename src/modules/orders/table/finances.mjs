import RootClass from '@helpers/root_class';
import App from '@src';
import Admin from './finances/admin.mjs';
import Manager from './finances/manager.mjs';

export default class Finances extends RootClass {
	constructor() {
		super();
		this.module = null;
	}

	init() {
		const module = App.user?.isAdmin ? Admin : Manager;
		this.module = new module();
		this.module.init();
	}
}

