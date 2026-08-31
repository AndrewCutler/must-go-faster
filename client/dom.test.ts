/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
*/

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	BoardElement,
	CancelButtonElement,
	ConnectionStatusElement,
	CountdownContainerElement,
	GameStatusModalElement,
	OpponentStatusElement,
	PlayerTypeElement,
} from './dom';

function renderDom(): void {
	document.body.innerHTML = `
		<div id="board"></div>
		<div id="getting-started"></div>
		<button
			id="cancel-button"
			class="button is-dark"
			aria-label="Cancel pending game"
			style="display:none"
		></button>
		<div id="opponent-status"></div>
		<div id="connection-status"></div>
		<div id="player-type-dropdown">
			<div id="player-type-panel">
				<button id="player-type-computer" class="button is-dark">
					Play computer
				</button>
				<button id="player-type-human" class="button is-dark">
					Play human
				</button>
			</div>
		</div>
		<div id="board-container"></div>
	`;
}

beforeEach(() => {
	renderDom();
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('BoardElement', () => {
	it('disables and enables pointer events on the board container', () => {
		const board = document.querySelector<HTMLDivElement>('#board')!;
		const boardElement = new BoardElement();

		boardElement.disable();
		expect(board.style.pointerEvents).toBe('none');

		boardElement.enable();

		expect(board.style.pointerEvents).toBe('auto');
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
	it('updates selection classes', () => {
		const computer = document.querySelector<HTMLButtonElement>(
			'#player-type-computer',
		)!;
		const human = document.querySelector<HTMLButtonElement>(
			'#player-type-human',
		)!;
		const playerType = new PlayerTypeElement();

		playerType.setSelection('human');
		expect(human.classList.contains('is-selected')).toBe(true);
		expect(computer.classList.contains('is-selected')).toBe(false);

		playerType.setSelection('computer');
		expect(computer.classList.contains('is-selected')).toBe(true);
		expect(human.classList.contains('is-selected')).toBe(false);
	});

	it('hides and shows the selector block', () => {
		const dropdown = document.querySelector<HTMLDivElement>(
			'#player-type-dropdown',
		)!;
		const playerType = new PlayerTypeElement();

		playerType.setSelection('human');
		playerType.hide();
		expect(dropdown.style.display).toBe('none');

		playerType.show();
		expect(dropdown.style.display).toBe('');
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

describe('CountdownContainerElement', () => {
	it('shows the human player color above the countdown', () => {
		const countdown = new CountdownContainerElement('white', 'black');
		const top = document.querySelector<HTMLDivElement>(
			'#countdown-container :nth-child(1)',
		)!;

		expect(top.textContent).toBe('black moves first');

		countdown.hide('white');
	});
});

describe('GameStatusModalElement', () => {
	it('formats draw outcomes clearly', () => {
		const modal = new GameStatusModalElement(() => {});
		modal.setOutcome('draw', 'stalemate');

		const header = document.querySelector<HTMLDivElement>('#modal-header')!;
		expect(header.textContent).toBe('You drew via stalemate.');
	});
});
