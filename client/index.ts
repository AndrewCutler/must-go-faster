import { MustGoFaster } from './must-go-faster';
import { ConnectButtonElement } from './dom';

window.onload = function () {
	initialize()
		.then(function (mustGoFaster): void {
			const button = new ConnectButtonElement();
			button.element!.addEventListener('click', function () {
				button.waitForOpponent();
				mustGoFaster.connect();
			});
		})
		.catch(function (error: Error) {
			console.error('Initialization error: ', error);
		});
};

function initialize(): Promise<MustGoFaster> {
	return new Promise<MustGoFaster>(function (resolve, reject) {
		try {
			const mustGoFaster = new MustGoFaster();
			resolve(mustGoFaster);
		} catch (error) {
			console.error(error);
			reject('Failed to initialize.');
		}
	});
}
