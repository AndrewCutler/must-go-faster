import { GameStatus, PlayerColor } from './models';

interface IElement {
	get element(): HTMLElement | undefined;
}

export class BoardElement implements IElement {
	private _element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this._element;
	}

	constructor() {
		const element = document.getElementById('board');
		if (!element) throw new Error('Cannot find #board');
		this._element = element;
	}

	enable(): void {
		this._element!.style.pointerEvents = 'auto';
	}
}

export class CountdownContainerElement implements IElement {
	private _element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this._element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>(
			'#countdown-container',
		);
		if (!element) throw new Error('Cannot find #countdown-container');
		this._element = element;
	}

	show(): void {
		this._element!.style.display = 'block';
	}

	hide(): void {
		this._element!.style.display = 'none';
	}

	setCountdownText(text: number): void {
		this._element!.innerText = text.toString();
	}
}

export class TimerElement implements IElement {
	private _element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this._element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>('#timer');
		if (!element) throw new Error('Cannot find #timer');
		this._element = element;
	}

	setTime(time: number): void {
		this._element!.innerHTML =
			'<div>' + (time > 0 ? time : 0).toFixed(1) + 's</div>';
	}
}

export class GameStatusModalElement implements IElement {
	private _element: HTMLElement | undefined;
	private _headerElement: HTMLElement | undefined;
	private _playAgainButtonElement: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this._element;
	}

	constructor() {
		const element =
			document.querySelector<HTMLDivElement>('#game-status-modal');
		if (!element) throw new Error('Cannot find #game-status-modal');
		this._element = element;
		const headerElement =
			document.querySelector<HTMLDivElement>('#modal-header');
		if (!headerElement) throw new Error('Cannot find #modal-header');
		this._headerElement = headerElement;
		const playAgainButton =
			document.querySelector<HTMLDivElement>('#play-again-button');
		if (!playAgainButton) throw new Error('Cannot find #play-again-button');
		this._playAgainButtonElement = playAgainButton;
		this._playAgainButtonElement.addEventListener('click', this.playAgain);
	}

	setTime(time: number): void {
		this._element!.innerHTML =
			'<div>' + (time > 0 ? time : 0).toFixed(1) + 's</div>';
	}

	show(): void {
		this._element!.style.display = 'block';
	}

	setOutcome(
		gameStatus: Omit<GameStatus, 'ongoing' | 'draw'>,
		method: 'timeout' | 'checkmate' | 'resignation' | 'abandonment',
	): void {
		this._headerElement!.innerText = `You ${gameStatus} via ${method}.`;
	}

	private playAgain(): void {
		console.log('play again');
	}
}

export class GameMetaElement implements IElement {
	private _element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this._element;
	}

	constructor() {
		const element = document.querySelector<HTMLDivElement>('#game-meta');
		if (!element) throw new Error('Cannot find #game-meta');
		this._element = element;
	}

	show({
		playerColor,
		whosNext,
	}: {
		playerColor: PlayerColor;
		whosNext: PlayerColor;
	}) {
		this._element!.style.visibility = 'inherit';

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
	private _element: HTMLElement | undefined;

	get element(): HTMLElement | undefined {
		return this._element;
	}

	constructor() {
		const element =
			document.querySelector<HTMLButtonElement>('#connect-button');
		if (!element) throw new Error('Cannot find #connect-button');
		this._element = element;
	}

	waitForOpponent(): void {
		this._element!.classList.add('is-loading');
	}

	gameJoined(): void {
		this._element!.classList.remove('is-loading');
		this._element!.style.display = 'none';
	}
}
