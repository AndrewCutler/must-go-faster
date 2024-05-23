import { MustGoFaster } from './must-go-faster';
import { Config } from './models';

window.onload = function () {
	initializeBoard()
		.then(getConfig)
		.then(function ({ config, mustGoFaster }): void {
			mustGoFaster.config = config;
			const button = document.querySelector('#connect-button')!;
			button.addEventListener('click', function () {
				button.classList.add('is-loading');
				mustGoFaster.connect();
			});
		})
		.catch(function (error: Error) {
			console.error('Initialization error: ', error);
		});
};

function getConfig(
	mustGoFaster: MustGoFaster,
): Promise<{ config: Config; mustGoFaster: MustGoFaster }> {
	// todo: pull from config
	return fetch('http://10.0.0.73:8000/config').then(async function (r) {
		try {
			const config = await r.json();
			return { config, mustGoFaster: mustGoFaster };
		} catch (error) {
			console.error(error);
			return { config: undefined, mustGoFaster: mustGoFaster };
		}
	});
}

function initializeBoard(): Promise<MustGoFaster> {
	return new Promise<MustGoFaster>(function (resolve, reject) {
		try {
			const mustGoFaster = new MustGoFaster();
			resolve(mustGoFaster);
		} catch (error) {
			console.error(error);
			reject('Failed to initialize board.');
		}
	});
}
