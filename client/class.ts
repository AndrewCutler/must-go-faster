import {
	ChessgroundConfig,
	Config,
	GameStartedRequest,
	GameStartedResponse,
	MoveResponse,
	PlayerColor,
	TimeoutRequest,
} from './models';
import * as cg from 'chessground/types.js';

export class MyClass {
	#moveType: 'gameStarted' | 'abandoned' | 'timeout' | 'move' | undefined;
	#gameId: string | undefined;
	#playerColor: PlayerColor | undefined;
	#timeLeft: number | undefined;
	#gameClock: number | undefined;
	#timerInterval: number | undefined;
	#config: Config | undefined;
	#connection: WebSocket | undefined;
	#board: any;

	set connection(value: WebSocket) {
		console.log('setting connection');
		if (!value) throw new Error('MyClass.connection cannot be undefined.');
		this.#connection = value;
	}

	get connection(): WebSocket | undefined {
		return this.#connection;
	}

	constructor() {}

	isGameStartedResponse(obj: unknown): this {
		this.#moveType = 'gameStarted';
		return this;
	}

	isMoveResponse(obj: unknown): this {
		this.#moveType = 'move';
		return this;
	}

	async start(response: GameStartedResponse): Promise<void> {
		if (response.gameStarted) {
			this.#gameId = response.gameId;
			this.#playerColor = response.playerColor;
			this.#timeLeft = this.#gameClock = this.#config?.startingTime;

			const gameMeta =
				document.querySelector<HTMLDivElement>('#game-meta')!;
			gameMeta.style.visibility = 'inherit';
			const gameMetaIcon =
				document.querySelector<HTMLElement>('#game-meta .icon i');
			if (this.#playerColor === 'black') {
				gameMetaIcon?.classList.add('is-black');
			} else {
				gameMetaIcon?.classList.remove('is-black');
			}
			const whoseMove = document.querySelector<HTMLDivElement>(
				'#game-meta #whose-move',
			)!;
			whoseMove.innerText = `${
				response.whosNext === 'white' ? 'White' : 'Black'
			} to play.`;
			const playerColorDiv = document.querySelector<HTMLDivElement>(
				'#game-meta #player-color',
			)!;
			playerColorDiv.innerText = `You play ${this.#playerColor}.`;

			this.#board.set({
				viewOnly: true,
				fen: response.fen,
				turnColor: response.whosNext,
				orientation: this.#playerColor,
				movable: {
					dests: this.toValidMoves(response.validMoves),
					color: this.#playerColor,
				},
				premovable: {
					enabled: true,
					showDests: true,
				},
				draggable: {
					enabled: true,
				},
			} as ChessgroundConfig);

			await this.showCountdownToStartGame();

			console.log(this.#board.state);
			this.setTimer();
			this.#board.set({
				viewOnly: false,
			});
		}
	}

	async showCountdownToStartGame(): Promise<void> {
		return new Promise((resolve) => {
			const countdownDisplay = document.querySelector<HTMLDivElement>(
				'#countdown-container',
			)!;
			countdownDisplay.style.display = 'block';
			let countdownInterval: number;
			let i = 5;
			const self = this;
			countdownInterval = window.setInterval(function () {
				if (i <= 0) {
					window.clearInterval(countdownInterval);
					countdownDisplay.style.display = 'none';
					if (self.#connection) {
						const gameStartedRequest: GameStartedRequest = {
							type: 'gameStarted',
							gameId: self.#gameId!,
						};
						self.#connection.send(
							JSON.stringify(gameStartedRequest),
						);
					}
					resolve();
				} else {
					countdownDisplay.innerText = i.toString();
					i--;
				}
			}, 1000);
		});
	}

	setTimer(): void {
		// clear previous interval
		window.clearInterval(this.#timerInterval);

		const timerDiv = document.querySelector<HTMLDivElement>('#timer')!;
		const start = new Date();
		const self = this;
		this.#timerInterval = window.setInterval(function () {
			if (!self.#timeLeft) {
				console.log('no time left');
				return;
			}
			if ((self.#gameClock ?? 0) <= 0) {
				window.clearInterval(self.#timerInterval);
				// send message to server to end game/find out the outcome
				if (self.connection) {
					const timeout: TimeoutRequest = {
						type: 'timeout',
						gameId: self.#gameId!,
						playerColor: self.#playerColor!,
						timeout: true,
					};
					self.connection.send(JSON.stringify(timeout));
				}
				return;
			}
			const diff = new Date().getTime() - start.getTime();
			self.#gameClock = self.#timeLeft - diff / 1_000;

			timerDiv.innerHTML =
				'<div>' +
				(self.#gameClock > 0 ? self.#gameClock : 0).toFixed(1) +
				's</div>';
		}, 10);
	}

	private toValidMoves(moves: { [key: string]: string[] }): cg.Dests {
		const validMoves = new Map();
		for (const [key, value] of Object.entries(moves)) {
			validMoves.set(key, value);
		}

		return validMoves;
	}
}
