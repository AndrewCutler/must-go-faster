/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
*/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	BoardElement,
	CancelButtonElement,
	ConfettiElement,
	ConnectionStatusElement,
	CountdownContainerElement,
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
		<div id="connection-status"></div>
		<div id="player-type-panel">
			<button id="player-type-computer" class="button is-dark">
				Play computer
			</button>
			<button id="player-type-human" class="button is-dark">
				Play human
			</button>
		</div>
		<div id="board-container"></div>
		<div id="confetti-stage"></div>
	`;
}

beforeEach(() => {
	renderDom();
});

afterEach(() => {
	vi.useRealTimers();
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
		const panel = document.querySelector<HTMLDivElement>(
			'#player-type-panel',
		)!;
		const playerType = new PlayerTypeElement();

		playerType.setSelection('human');
		playerType.hide();
		expect(panel.style.display).toBe('none');

		playerType.show();
		expect(panel.style.display).toBe('');
	});
});


describe('CountdownContainerElement', () => {
	it('keeps the flashing color through piece replacement and resets between games', () => {
		const board = document.querySelector<HTMLElement>('#board')!;
		for (const color of ['white', 'black'] as const) {
			const countdown = new CountdownContainerElement(color);
			const piece = document.createElement('piece');
			piece.className = color;
			board.appendChild(piece);
			piece.replaceWith(piece.cloneNode());
			expect(board.dataset.countdownColor).toBe(color);
			countdown.hide(color);
			expect(board.dataset.countdownColor).toBeUndefined();
		}
	});

	it.each(['white', 'black'] as const)('shows %s as the starting color above the countdown', (whoMovesFirst) => {
		const countdown = new CountdownContainerElement(whoMovesFirst);
		const top = document.querySelector<HTMLDivElement>(
			'#countdown-container :nth-child(1)',
		)!;

		expect(top.textContent).toBe(`${whoMovesFirst} moves first`);

		countdown.hide(whoMovesFirst);
	});
});

describe('ConfettiElement', () => {
	it('shows for one second, fades for half a second, then hides', () => {
		vi.useFakeTimers();
		const confetti = new ConfettiElement();
		const element = confetti.element!;

		confetti.show();
		expect(element.style.display).toBe('flex');

		vi.advanceTimersByTime(999);
		expect(element.classList.contains('is-fading')).toBe(false);

		vi.advanceTimersByTime(1);
		expect(element.classList.contains('is-fading')).toBe(true);
		expect(element.style.display).toBe('flex');

		vi.advanceTimersByTime(499);
		expect(element.style.display).toBe('flex');

		vi.advanceTimersByTime(1);
		expect(element.style.display).toBe('none');
	});
});
