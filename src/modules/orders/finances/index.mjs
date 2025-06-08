import RootClass from '@helpers/root_class';
import { user } from '@src';
import Admin from './admin.mjs';
import Manager from './manager.mjs';

export default class Finances extends RootClass {
	constructor() {
		super();
		this.module = null;
	}

	init() {
		const module = user?.isAdmin ? Admin : Manager;
		this.module = new module();
		this.module.init();
	}
}

