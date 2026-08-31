/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
*/

import { GameStatus, PlayerColor } from './models';

interface IElement {
	get element(): HTMLElement | undefined;
}

export class BoardElement implements IElement {
	#element: HTMLElement | undefined;
	readonly #selector: string = '#board';

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLElement>(this.#selector);
		if (!element) throw new Error(`Cannot find ${this.#selector}.`);
		this.#element = element;
	}

	disable(): void {
		this.#element!.style.pointerEvents = 'none';
	}

	enable(): void {
		this.#element!.style.pointerEvents = 'auto';
	}
}

export class CountdownContainerElement implements IElement {
	#element: HTMLElement | undefined;
	readonly #selector: string = '#countdown-container';

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor(whoMovesFirst: PlayerColor, playerColor: PlayerColor) {
		const parent = document.querySelector('#board')!;

		const element = document.createElement('div');
		element.id = this.#selector.replace('#', '');

		const top = document.createElement('div');
		top.textContent = `${playerColor} moves first`;
		top.style.fontSize = '2rem';
		(top.style as any)['-webkit-text-stroke'] = '1px black';

		const bottom = document.createElement('div');
		bottom.textContent = 'Get ready...';
		bottom.style.fontSize = '2rem';
		(top.style as any)['-webkit-text-stroke'] = '1px black';

		element.appendChild(top);
		element.appendChild(bottom);
		parent.prepend(element);
		fadePieces(whoMovesFirst, true);

		this.#element = element;
	}

	hide(whoMovesFirst: PlayerColor): void {
		this.#element!.remove();
		fadePieces(whoMovesFirst, false);
	}

	setCountdownText(text: number): void {
		const bottom: HTMLElement = document.querySelector(
			'#countdown-container :nth-child(2)',
		)!;
		bottom.innerText = text.toString();
	}
}

export function fadePieces(playerColor: PlayerColor, on = true): void {
	for (const node of document.querySelectorAll(`piece.${playerColor}`)) {
		if (on) {
			node.classList.add('fade');
		} else {
			node.classList.remove('fade');
		}
	}
}

export class ControlsElement implements IElement {
	#element: HTMLElement | undefined;
	#whiteClockElement: HTMLElement | undefined;
	#blackClockElement: HTMLElement | undefined;
	readonly #selector = '#controls';

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>(this.#selector);
		if (!element) throw new Error(`Cannot find ${this.#selector}`);
		this.#element = element;
		const whiteClockElement =
			document.querySelector<HTMLDivElement>('#white-clock');
		if (!whiteClockElement) throw new Error('Cannot find #white-clock');
		this.#whiteClockElement = whiteClockElement;
		const blackClockElement =
			document.querySelector<HTMLDivElement>('#black-clock');
		if (!blackClockElement) throw new Error('Cannot find #black-clock');
		this.#blackClockElement = blackClockElement;
	}

	setTime(whiteTime: number, blackTime: number): void {
		this.#whiteClockElement!.innerHTML =
			'<div>' + (whiteTime > 0 ? whiteTime : 0).toFixed(1) + 's</div>';
		this.#blackClockElement!.innerHTML =
			'<div>' + (blackTime > 0 ? blackTime : 0).toFixed(1) + 's</div>';
	}

	setActive(color: PlayerColor) {
		const clocks = document.querySelector<HTMLDivElement>('#clocks');
		if (clocks) {
			clocks.dataset.activeColor = color;
		}
		if (color === 'white') {
			this.#whiteClockElement!.classList.add('is-running');
			this.#blackClockElement!.classList.remove('is-running');
		} else {
			this.#whiteClockElement!.classList.remove('is-running');
			this.#blackClockElement!.classList.add('is-running');
		}
	}
}

export class GameMetaElement implements IElement {
	readonly #selector: string = '#game-meta';
	#element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor({
		playerColor,
		whosNext,
	}: {
		playerColor: PlayerColor;
		whosNext: PlayerColor;
	}) {
		const element = document.querySelector<HTMLDivElement>(this.#selector);
		if (!element) throw new Error(`Cannot find ${this.#selector}.`);
		this.#element = element;
		this.show({
			playerColor,
			whosNext,
		});
	}

	private show({
		playerColor,
		whosNext,
	}: {
		playerColor: PlayerColor;
		whosNext: PlayerColor;
	}) {
		this.#element!.style.visibility = 'inherit';

		const gameMetaIcon =
			document.querySelector<HTMLElement>('#game-meta .icon i');
		if (playerColor === 'black') {
			gameMetaIcon?.classList.add('is-black');
		} else {
			gameMetaIcon?.classList.remove('is-black');
		}

		const whoseMove = document.querySelector<HTMLDivElement>(
			'#game-meta #whose-move',
		)!;
		whoseMove.innerText = `${
			whosNext === 'white' ? 'White' : 'Black'
		} to play.`;
	}
}

export class PlayerTypeElement implements IElement {
	#element: HTMLElement | undefined;
	#computerButton: HTMLButtonElement | undefined;
	#humanButton: HTMLButtonElement | undefined;
	readonly #selector = '#player-type-panel';

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLElement>(this.#selector);
		if (!element) throw new Error(`Cannot find ${this.#selector}.`);
		this.#element = element;
		const computerButton =
			document.querySelector<HTMLButtonElement>('#player-type-computer');
		const humanButton =
			document.querySelector<HTMLButtonElement>('#player-type-human');
		if (!computerButton || !humanButton) {
			throw new Error('Cannot find player type buttons.');
		}
		this.#computerButton = computerButton;
		this.#humanButton = humanButton;
	}

	hide(): void {
		this.#element!.style.display = 'none';
	}

	show(): void {
		this.#element!.style.display = '';
	}

	setSelection(value: string): void {
		switch (value) {
			case 'computer':
				this.#computerButton!.classList.add('is-selected');
				this.#humanButton!.classList.remove('is-selected');
				break;
			case 'human':
				this.#humanButton!.classList.add('is-selected');
				this.#computerButton!.classList.remove('is-selected');
				break;
			default:
				throw new Error(`Invalid player type: ${value}.`);
		}
	}

	setPending(value?: string): void {
		this.#computerButton!.disabled = true;
		this.#humanButton!.disabled = true;
		this.#element!.dataset.pending = value ?? '';
	}

	clearPending(): void {
		this.#computerButton!.disabled = false;
		this.#humanButton!.disabled = false;
		delete this.#element!.dataset.pending;
	}

	onComputerClick(handler: () => void): void {
		this.#computerButton!.addEventListener('click', handler);
	}

	onHumanClick(handler: () => void): void {
		this.#humanButton!.addEventListener('click', handler);
	}
}

export class CancelButtonElement implements IElement {
	readonly #selector = '#cancel-button';
	#element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLButtonElement>(
			this.#selector,
		);
		if (!element) throw new Error(`Cannot find ${this.#selector}.`);
		this.#element = element;
	}

	show(): void {
		this.#element!.style.display = '';
	}

	hide(): void {
		this.#element!.style.display = 'none';
	}
}

export class ConnectionStatusElement implements IElement {
	readonly #selector = '#connection-status';
	#element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>(this.#selector);
		if (!element) throw new Error(`Cannot find ${this.#selector}.`);
		this.#element = element;
	}

	show(message: string, tone: 'info' | 'error' = 'info'): void {
		this.#element!.textContent = message;
		this.#element!.dataset.tone = tone;
		this.#element!.style.visibility = 'visible';
	}

	clear(): void {
		this.#element!.textContent = '';
		this.#element!.dataset.tone = 'info';
		this.#element!.style.visibility = 'hidden';
	}
}

export class ConfettiElement implements IElement {
	readonly #selector = '#confetti-stage';
	#element: HTMLElement | undefined;
	#hideTimer: number | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLElement>(this.#selector);
		if (!element) throw new Error(`Cannot find ${this.#selector}.`);
		this.#element = element;
	}

	show(): void {
		if (this.#hideTimer !== undefined) {
			window.clearTimeout(this.#hideTimer);
			this.#hideTimer = undefined;
		}

		this.#element!.classList.remove('is-fading');
		this.#element!.style.display = 'flex';

		window.setTimeout(() => {
			this.#element!.classList.add('is-fading');
			this.#hideTimer = window.setTimeout(() => {
				this.#element!.style.display = 'none';
				this.#element!.classList.remove('is-fading');
				this.#hideTimer = undefined;
			}, 750);
		}, 1250);
	}
}
