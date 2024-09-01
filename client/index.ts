import { MustGoFaster } from './must-go-faster';
import { ConnectButtonElement } from './dom';

window.onload = function () {
	try {
		const mustGoFaster = new MustGoFaster();
		const button = new ConnectButtonElement();
		button.element!.addEventListener('click', function () {
			button.waitForOpponent();
			mustGoFaster.connect();
		});
	} catch (error) {
		console.error('Failed to initialize: ', error);
	}
};
