import { GameStatus, PlayerColor } from './models';

interface IElement {
	get element(): HTMLElement | undefined;
}

export class BoardElement implements IElement {
	#element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.getElementById('board');
		if (!element) throw new Error('Cannot find #board');
		this.#element = element;
	}

	enable(): void {
		this.#element!.style.pointerEvents = 'auto';
	}
}

export class CountdownContainerElement implements IElement {
	#element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>(
			'#countdown-container',
		);
		if (!element) throw new Error('Cannot find #countdown-container');
		this.#element = element;
	}

	show(): void {
		this.#element!.style.display = 'block';
	}

	hide(): void {
		this.#element!.style.display = 'none';
	}

	setCountdownText(text: number): void {
		this.#element!.innerText = text.toString();
	}
}

export class TimerElement implements IElement {
	#element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>('#timer');
		if (!element) throw new Error('Cannot find #timer');
		this.#element = element;
	}

	setTime(time: number): void {
		this.#element!.innerHTML =
			'<div>' + (time > 0 ? time : 0).toFixed(1) + 's</div>';
	}
}

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
		// don't do this; have to render it instead
		// const element =
		// 	document.querySelector<HTMLDivElement>(this.#selector);
		// if (!element) throw new Error(`Cannot find ${this.#selector}`);
		// const headerElement =
		// 	document.querySelector<HTMLDivElement>('#modal-header');
		// if (!headerElement) throw new Error('Cannot find #modal-header');
		// const playAgainButton =
		// 	document.querySelector<HTMLDivElement>('#play-again-button');
		// if (!playAgainButton) throw new Error('Cannot find #play-again-button');
		this.#playAgainButtonElement = playAgainButton;
		this.#playAgainButtonElement.addEventListener('click', function () {
			self.playAgain(sendMessageCallback);
		});
	}

	setTime(time: number): void {
		this.#element!.innerHTML =
			'<div>' + (time > 0 ? time : 0).toFixed(1) + 's</div>';
	}

	show(): void {
		// this.#element!.style.display = 'block';
	}

	hide(): void {
		// should be destroyed, not hidden
		this.#element!.style.display = 'none';
		document.querySelector(this.#selector)!.remove();
	}

	setOutcome(
		gameStatus: Omit<GameStatus, 'ongoing' | 'draw'>,
		method: 'timeout' | 'checkmate' | 'resignation' | 'abandonment',
	): void {
		this.#headerElement!.innerText = `You ${gameStatus} via ${method}.`;
	}

	private playAgain(sendMessageCallback: () => void): void {
		this.hide();
		sendMessageCallback();
	}
}

export class GameMetaElement implements IElement {
	#element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>('#game-meta');
		if (!element) throw new Error('Cannot find #game-meta');
		this.#element = element;
	}

	show({
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

		const playerColorDiv = document.querySelector<HTMLDivElement>(
			'#game-meta #player-color',
		)!;
		playerColorDiv.innerText = `You play ${playerColor}.`;
	}
}

export class ConnectButtonElement implements IElement {
	#element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this.#element;
	}

	constructor() {
		const element =
			document.querySelector<HTMLButtonElement>('#connect-button');
		if (!element) throw new Error('Cannot find #connect-button');
		this.#element = element;
	}

	waitForOpponent(): void {
		this.#element!.classList.add('is-loading');
	}

	gameJoined(): void {
		this.#element!.classList.remove('is-loading');
		this.#element!.style.display = 'none';
	}
}
