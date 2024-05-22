import {
	ChessgroundConfig,
	Config,
	GameStartedRequest,
	GameStartedResponse,
	GameStatus,
	Move,
	MoveResponse,
	PlayerColor,
	PremoveRequest,
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
	#response: any;

	set connection(value: WebSocket) {
		console.log('setting connection');
		if (!value) throw new Error('MyClass.connection cannot be undefined.');
		this.#connection = value;
	}

	get connection(): WebSocket | undefined {
		return this.#connection;
	}

	constructor() {}

	handleResponse(obj: unknown): this {
		this.#response = obj;
		if ((obj as any).gameStarted !== undefined) {
			this.#moveType = 'gameStarted';
		}

		if (
			(obj as any).validMoves !== undefined &&
			(obj as any).gameStarted === undefined
		) {
			this.#moveType = 'move';
		}

		if ((obj as any).loser !== undefined) {
			this.#moveType = 'timeout';
		}

		if ((obj as any).abandoned !== undefined) {
			this.#moveType = 'abandoned';
		}

		return this;
	}

	// isGameStartedResponse(obj: unknown): this {
	// 	if ((obj as any).gameStarted !== undefined) {
	// 		this.#moveType = 'gameStarted';
	// 	}
	// 	return this;
	// }

	// isMoveResponse(obj: unknown): this {
	// 	if (
	// 		(obj as any).validMoves !== undefined &&
	// 		(obj as any).gameStarted === undefined
	// 	) {
	// 		this.#moveType = 'move';
	// 	}
	// 	return this;
	// }

	// isTimeoutResponse(obj: unknown): this {
	// 	if ((obj as any).loser !== undefined) {
	// 		this.#moveType = 'timeout';
	// 	}
	// 	return this;
	// }

	// isAbandonedResponse(obj: unknown): this {
	// 	if ((obj as any).abandoned !== undefined) {
	// 		this.#moveType = 'abandoned';
	// 	}
	// 	return this;
	// }

	async start(): Promise<void> {
		if ((this.#moveType = 'gameStarted')) {
			const response = this.#response as GameStartedResponse;
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

	move(): void {
		if (this.#moveType === 'move') {
			const response = this.#response as MoveResponse;
			let gameStatus: GameStatus | 'lost' | 'won' = 'ongoing';
			if (response.isCheckmated) {
				gameStatus =
					response.isCheckmated === this.#playerColor
						? 'lost'
						: 'won';
				this.gameOver(gameStatus, 'checkmate');
				this.#gameClock = 0;
				return;
			}

			this.#timeLeft =
				this.#playerColor === 'white'
					? response.whiteTimeLeft
					: response.blackTimeLeft;
			this.setTimer();
			if (this.#board.state.premovable.current) {
				// send premove message which checks if premove is valid
				// if so, play response on server and send updated fen
				const [from, to] = this.#board.state.premovable.current;
				this.sendPremoveMessage({ from, to });
				this.#board.playPremove();
			}

			this.#board.set({
				fen: response.fen,
				turnColor: response.whosNext,
				movable: {
					dests: this.toValidMoves(response.validMoves),
				},
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

	private gameOver(
		gameStatus: Omit<GameStatus, 'ongoing' | 'draw'>,
		method: 'timeout' | 'checkmate' | 'resignation' | 'abandonment',
	): void {
		// have to add draws
		const modal =
			document.querySelector<HTMLDivElement>('#game-status-modal')!;
		modal.style.display = 'block';
		const modalHeader =
			document.querySelector<HTMLDivElement>('#modal-header')!;
		modalHeader.innerText = `You ${gameStatus} via ${method}.`;
	}

	private sendPremoveMessage(p: Move): void {
		if (this.#connection) {
			const premove: PremoveRequest = {
				type: 'premove',
				gameId: this.#gameId!,
				premove: p,
			};
			this.#connection.send(JSON.stringify(premove));
		} else {
			throw new Error('connection is undefined.');
		}
	}
}
