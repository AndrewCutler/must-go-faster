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

export class GettingStartedElement implements IElement {
	#element: HTMLElement | undefined;
	readonly #selector: string = '#getting-started';

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>(this.#selector);
		if (!element) throw new Error('Cannot find #getting-started');
		this.#element = element;
	}

	hide(): void {
		this.#element!.remove();
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
		if (color === 'white') {
			this.#whiteClockElement!.classList.add('is-running');
			this.#blackClockElement!.classList.remove('is-running');
		} else {
			this.#whiteClockElement!.classList.remove('is-running');
			this.#blackClockElement!.classList.add('is-running');
		}
	}
}

// todo: bulma
export class GameStatusModalElement implements IElement {
	readonly #selector: string = '#game-status-modal';
	#element: HTMLElement | undefined;
	#headerElement: HTMLElement | undefined;
	#playAgainButtonElement: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor(sendMessageCallback: () => void) {
		const self = this;
		const parent = document.querySelector('#board-container')!;
		const element = document.createElement('div');
		element.id = this.#selector.replace('#', '');
		const headerElement = document.createElement('div');
		headerElement.id = 'modal-header';
		const contentElement = document.createElement('div');
		contentElement.id = 'modal-content';
		const modalButtonContainer = document.createElement('div');
		modalButtonContainer.id = 'modal-button-container';
		const playAgainButton = document.createElement('button');
		playAgainButton.id = 'play-again-button';
		playAgainButton.classList.add('button');
		playAgainButton.classList.add('is-dark');
		playAgainButton.innerText = 'Play again';

		modalButtonContainer.appendChild(playAgainButton);
		contentElement.appendChild(modalButtonContainer);

		element.appendChild(headerElement);
		element.appendChild(contentElement);
		parent.prepend(element);

		this.#element = element;
		this.#headerElement = headerElement;
		this.#playAgainButtonElement = playAgainButton;
		this.#playAgainButtonElement.addEventListener('click', function () {
			self.playAgain(sendMessageCallback);
		});
	}

	setTime(time: number): void {
		this.#element!.innerHTML =
			'<div>' + (time > 0 ? time : 0).toFixed(1) + 's</div>';
	}

	hide(): void {
		this.#element!.remove();
	}

	setOutcome(
		gameStatus: Exclude<GameStatus, 'ongoing'>,
		method: string,
	): void {
		const verb = gameStatus === 'draw' ? 'drew' : gameStatus;
		this.#headerElement!.textContent = `You ${verb} via ${method}.`;
	}

	private playAgain(sendMessageCallback: () => void): void {
		this.hide();
		sendMessageCallback();
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

export class ConnectButtonElement implements IElement {
	readonly #selector = '#connect-button';
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

	setPending(): void {
		this.#element!.style.display = '';
		this.#element!.classList.add('is-loading');
		this.#element!.setAttribute('disabled', 'true');
		this.#element!.textContent = 'Play';
	}

	reset(): void {
		this.#element!.style.display = '';
		this.#element!.classList.remove('is-loading');
		this.#element!.removeAttribute('disabled');
		this.#element!.textContent = 'Play';
	}

	hide(): void {
		this.#element!.style.display = 'none';
	}

	gameJoined(): void {
		this.hide();
	}
}

export class PlayerTypeElement implements IElement {
	#element: HTMLElement | undefined;
	readonly #selector = '#player-type-dropdown';

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>(this.#selector);
		if (!element) throw new Error(`Cannot find ${this.#selector}.`);
		this.#element = element;
	}

	toggleActive(): void {
		if (this.#element!.classList.contains('is-active')) {
			this.#element!.classList.remove('is-active');
		} else {
			this.#element!.classList.add('is-active');
		}
	}

	hide(): void {
		this.#element!.classList.remove('is-active');
		this.#element!.style.display = 'none';
	}

	show(): void {
		this.#element!.style.display = '';
	}

	setSelection(value: string): void {
		const valueElement = document.querySelector<HTMLSpanElement>(
			'#player-type-dropdown-value',
		)!;
		switch (value) {
			case 'computer':
				valueElement.textContent = 'Computer';
				break;
			case 'human':
				valueElement.textContent = 'Human';
				break;
			default:
				throw new Error(`Invalid player type: ${value}.`);
		}
	}
}

export class OpponentStatusElement implements IElement {
	readonly #selector = '#opponent-status';
	#element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>(this.#selector);
		if (!element) throw new Error(`Cannot find ${this.#selector}.`);
		this.#element = element;
	}

	show(message: string): void {
		this.#element!.textContent = message;
		this.#element!.style.visibility = 'visible';
	}

	clear(): void {
		this.#element!.textContent = '';
		this.#element!.style.visibility = 'hidden';
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
