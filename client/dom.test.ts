/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
*/

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	CancelButtonElement,
	ConnectionStatusElement,
	ConnectButtonElement,
	ResignButtonElement,
	OpponentStatusElement,
	PlayerTypeElement,
} from './dom';

function renderDom(): void {
	document.body.innerHTML = `
		<div id="board"></div>
		<div id="getting-started"></div>
		<button id="connect-button" class="button is-dark">Play</button>
		<button
			id="cancel-button"
			class="button is-dark"
			aria-label="Cancel pending game"
			style="display:none"
		></button>
		<button
			id="resign-button"
			class="button is-dark"
			aria-label="Resign game"
			style="display:none"
			disabled
		></button>
		<div id="opponent-status"></div>
		<div id="connection-status"></div>
		<div id="player-type-dropdown" class="dropdown">
			<span id="player-type-dropdown-value">Computer</span>
		</div>
	`;
}

beforeEach(() => {
	renderDom();
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('ConnectButtonElement', () => {
	it('switches the play button into pending, reset, and joined states', () => {
		const button = document.querySelector<HTMLButtonElement>(
			'#connect-button',
		)!;
		const connectButton = new ConnectButtonElement();

		connectButton.setPending();
		expect(button.textContent).toBe('Play');
		expect(button.disabled).toBe(true);
		expect(button.classList.contains('is-loading')).toBe(true);

		connectButton.reset();
		expect(button.disabled).toBe(false);
		expect(button.classList.contains('is-loading')).toBe(false);
		expect(button.style.display).toBe('');

		connectButton.gameJoined();
		expect(button.style.display).toBe('none');
	});
});

describe('CancelButtonElement', () => {
	it('shows and hides the split cancel control', () => {
		const button = document.querySelector<HTMLButtonElement>(
			'#cancel-button',
		)!;
		const cancelButton = new CancelButtonElement();

		cancelButton.show();
		expect(button.style.display).toBe('');

		cancelButton.hide();
		expect(button.style.display).toBe('none');
	});
});

describe('ResignButtonElement', () => {
	it('shows and hides the placeholder resign control', () => {
		const button = document.querySelector<HTMLButtonElement>(
			'#resign-button',
		)!;
		const resignButton = new ResignButtonElement();

		resignButton.show();
		expect(button.style.display).toBe('');

		resignButton.hide();
		expect(button.style.display).toBe('none');
	});
});

describe('ConnectionStatusElement', () => {
	it('updates the connection status message and tone', () => {
		const status = document.querySelector<HTMLDivElement>(
			'#connection-status',
		)!;
		const connectionStatus = new ConnectionStatusElement();

		connectionStatus.show('Waiting for opponent...', 'info');
		expect(status.textContent).toBe('Waiting for opponent...');
		expect(status.dataset.tone).toBe('info');
		expect(status.style.visibility).toBe('visible');

		connectionStatus.show('Lobby expired.', 'error');
		expect(status.textContent).toBe('Lobby expired.');
		expect(status.dataset.tone).toBe('error');

		connectionStatus.clear();
		expect(status.textContent).toBe('');
		expect(status.dataset.tone).toBe('info');
		expect(status.style.visibility).toBe('hidden');
	});
});

describe('PlayerTypeElement', () => {
	it('toggles the dropdown and updates the displayed selection', () => {
		const dropdown = document.querySelector<HTMLDivElement>(
			'#player-type-dropdown',
		)!;
		const value = document.querySelector<HTMLSpanElement>(
			'#player-type-dropdown-value',
		)!;
		const playerType = new PlayerTypeElement();

		playerType.toggleActive();
		expect(dropdown.classList.contains('is-active')).toBe(true);

		playerType.toggleActive();
		expect(dropdown.classList.contains('is-active')).toBe(false);

		playerType.setSelection('human');
		expect(value.textContent).toBe('Human');

		playerType.setSelection('computer');
		expect(value.textContent).toBe('Computer');
	});

	it('hides, shows, and resets the selector', () => {
		const dropdown = document.querySelector<HTMLDivElement>(
			'#player-type-dropdown',
		)!;
		const value = document.querySelector<HTMLSpanElement>(
			'#player-type-dropdown-value',
		)!;
		const playerType = new PlayerTypeElement();

		playerType.setSelection('human');
		playerType.hide();
		expect(dropdown.style.display).toBe('none');

		playerType.show();
		expect(dropdown.style.display).toBe('');
		expect(value.textContent).toBe('Human');
	});
});

describe('OpponentStatusElement', () => {
	it('shows and clears the opponent label above the clock', () => {
		const status = document.querySelector<HTMLDivElement>(
			'#opponent-status',
		)!;
		const opponentStatus = new OpponentStatusElement();

		opponentStatus.show('Playing human');
		expect(status.textContent).toBe('Playing human');
		expect(status.style.visibility).toBe('visible');

		opponentStatus.clear();
		expect(status.textContent).toBe('');
		expect(status.style.visibility).toBe('hidden');
	});
});
