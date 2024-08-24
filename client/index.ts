import { MustGoFaster } from './must-go-faster';
import { Config } from './models';
import { ConnectButtonElement } from './dom';

window.onload = function () {
	initialize()
		.then(getConfig)
		.then(function ({ config, mustGoFaster }): void {
			mustGoFaster.setConfig(config);
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

function getConfig(
	mustGoFaster: MustGoFaster,
): Promise<{ config: Config; mustGoFaster: MustGoFaster }> {
    // TODO: https
	const baseUrl = process.env.BASE_URL;
	return fetch(`http://${baseUrl}/config`).then(async function (r) {
		try {
			const config = await r.json();
			return { config, mustGoFaster: mustGoFaster };
		} catch (error) {
			console.error(error);
			return { config: undefined, mustGoFaster: mustGoFaster };
		}
	});
}

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
