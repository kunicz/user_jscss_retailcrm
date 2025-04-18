import App from '@src';
import Admin from './finances/admin.mjs';
import Manager from './finances/manager.mjs';

export default class Finances {
	constructor() {
		this.module = null;
	}

	init() {
		const module = App.user?.isAdmin ? Admin : Manager;
		this.module = new module();
		this.module.init();
	}

	destroy() {
		this.module?.destroy?.();
	}
}

