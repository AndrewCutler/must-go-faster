import { Chessground } from 'chessground';
import {
	ChessgroundConfig,
	Config,
	GameJoinedFromServer,
	GameStartedFromServer,
	GameStartedToServer,
	GameStatus,
	Message,
	Move,
	MoveFromServer,
	MoveToServer,
	ToPayload,
	PlayerColor,
	PremoveToServer,
	TimeoutFromServer,
	TimeoutToServer,
	ToMessage,
	FromMessage,
	FromPayload,
} from './models';

import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';

export class MustGoFaster {
	private gameId: string | undefined;
	private playerColor: PlayerColor | undefined;
	private timeLeft: number | undefined;
	private gameClock: number | undefined;
	private timerInterval: number | undefined;
	private config: Config | undefined;
	private connection: WebSocket | undefined;
	private board: ChessgroundApi | undefined;
	private message: Message | undefined;

	setConfig(value: Config) {
		this.config = value;
	}

	constructor() {
		console.log('Initializing MustGoFaster.');
		this.connect = this.connect.bind(this);
		const initialConfig: ChessgroundConfig = {
			movable: {
				free: false,
				color: 'white',
			},
		};
		this.board = Chessground(
			document.getElementById('board')!,
			initialConfig,
		);
		this.board.set({
			viewOnly: false,
			movable: {
				events: {
					after: this.handleClientMove(),
				},
			},
			premovable: {
				enabled: true,
				showDests: true,
			},
			predroppable: {
				enabled: true,
			},
			draggable: {
				enabled: true,
			},
		});
	}

	connect(): void {
		console.log('Connecting...');
		const ws = new WebSocket('ws://10.0.0.73:8000/connect', []);
		ws.onopen = function (event) {
			document.getElementById('board')!.style.pointerEvents = 'auto';
		};

		const self = this;
		ws.onmessage = function (event) {
			try {
				const message: FromMessage<FromPayload> = JSON.parse(
					event.data,
				);
				self.handleMessage(message);
			} catch (e) {
				console.error(e);
			}
		};
		this.connection = ws;
	}

	private async handleMessage(message: FromMessage<FromPayload>) {
		this.message = message;

		console.log('Handle message: ', { message });
		switch (message.type) {
			case 'GameJoinedFromServerType':
				await this.setupGame();
				break;
			case 'GameStartedFromServerType':
				this.enableBoard();
				break;
			case 'MoveFromServerType':
				this.updateBoardWithMove();
				break;
			case 'TimeoutFromServerType':
				this.timeout();
				break;
			case 'AbandonedFromServerType':
				this.abandoned();
				break;
		}
	}

	private sendMessage(message: ToMessage<ToPayload>): void {
		if (!this.connection) {
			console.error('Attempted send() on closed connection.');
			return;
		}

		try {
			this.connection.send(JSON.stringify(message));
		} catch (error) {
			console.error('Cannot JSON.stingify message: ', message);
		}
	}

	private async setupGame(): Promise<void> {
		console.log('start: ', { response: this.message });
		const response = this.message as FromMessage<GameStartedFromServer>;
		this.setupBoard(response);
		console.log(this.board!.state);

		await this.showCountdownToStartGame();
	}

	private enableBoard(): void {
		this.setTimer();
		this.board!.set({
			viewOnly: false,
		});
	}

	private updateBoardWithMove(): void {
		const payload = (this.message! as FromMessage<MoveFromServer>).payload!;
		console.log('move: ', { move: this.message });
		let gameStatus: GameStatus | 'lost' | 'won' = 'ongoing';
		if (payload.isCheckmated) {
			gameStatus =
				payload.isCheckmated === this.playerColor ? 'lost' : 'won';
			this.gameOver(gameStatus, 'checkmate');
			this.gameClock = 0;
			return;
		}

		this.timeLeft =
			this.playerColor === 'white'
				? payload.whiteTimeLeft
				: payload.blackTimeLeft;
		this.setTimer();
		if (this.board!.state.premovable.current) {
			// send premove message which checks if premove is valid
			// if so, play response on server and send updated fen
			const [from, to] = this.board!.state.premovable.current;
			this.sendPremoveMessage({ from, to });
			this.board!.playPremove();
		}

		this.board!.set({
			fen: payload.fen,
			turnColor: payload.whosNext,
			movable: {
				dests: this.toValidMoves(payload.validMoves),
			},
		});
	}

	private timeout(): void {
		let status: GameStatus = 'won';
		if (
			(this.message! as FromMessage<TimeoutFromServer>).payload!.loser ===
			this.playerColor
		) {
			status = 'lost';
		}
		this.gameOver(status, 'timeout');
	}

	private abandoned(): void {
		let status: GameStatus = 'won';
		this.gameOver(status, 'abandonment');
		if (this.connection) {
			this.connection.close();
		}
		// wipe out all game-specific data in class
	}

	private async showCountdownToStartGame(): Promise<void> {
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
					if (self.connection) {
						const gameStartedRequest: ToMessage<GameStartedToServer> =
							{
								type: 'GameStartedToServerType',
								gameId: self.gameId!,
								playerColor: self.playerColor!,
							};
						self.sendMessage(gameStartedRequest);
					}
					resolve();
				} else {
					countdownDisplay.innerText = i.toString();
					i--;
				}
			}, 1000);
		});
	}

	private setTimer(): void {
		// clear previous interval
		window.clearInterval(this.timerInterval);

		const timerDiv = document.querySelector<HTMLDivElement>('#timer')!;
		const start = new Date();
		const self = this;
		this.timerInterval = window.setInterval(function () {
			if (!self.timeLeft) {
				console.log('no time left', self.timeLeft);
				return;
			}
			if ((self.gameClock ?? 0) <= 0) {
				window.clearInterval(self.timerInterval);
				// send message to server to end game/find out the outcome
				if (self.connection) {
					const timeout: ToMessage<TimeoutToServer> = {
						type: 'TimeoutToServerType',
						gameId: self.gameId!,
						playerColor: self.playerColor!,
						payload: {
							timeout: true,
						},
					};
					self.sendMessage(timeout);
				}
				return;
			}
			const diff = new Date().getTime() - start.getTime();
			self.gameClock = self.timeLeft - diff / 1_000;

			timerDiv.innerHTML =
				'<div>' +
				(self.gameClock > 0 ? self.gameClock : 0).toFixed(1) +
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
		console.log('gameOver: ', { gameStatus, method });
		// have to add draws
		const modal =
			document.querySelector<HTMLDivElement>('#game-status-modal')!;
		modal.style.display = 'block';
		const modalHeader =
			document.querySelector<HTMLDivElement>('#modal-header')!;
		modalHeader.innerText = `You ${gameStatus} via ${method}.`;
	}

	private setupBoard(message: FromMessage<GameStartedFromServer>) {
		this.gameId = message.gameId;
		this.playerColor = message.playerColor;
		this.timeLeft = this.gameClock = this.config?.startingTime;

		const payload = message.payload as GameJoinedFromServer;

		const gameMeta = document.querySelector<HTMLDivElement>('#game-meta')!;
		gameMeta.style.visibility = 'inherit';
		const gameMetaIcon =
			document.querySelector<HTMLElement>('#game-meta .icon i');
		if (this.playerColor === 'black') {
			gameMetaIcon?.classList.add('is-black');
		} else {
			gameMetaIcon?.classList.remove('is-black');
		}
		const whoseMove = document.querySelector<HTMLDivElement>(
			'#game-meta #whose-move',
		)!;
		whoseMove.innerText = `${
			payload.whosNext === 'white' ? 'White' : 'Black'
		} to play.`;
		const playerColorDiv = document.querySelector<HTMLDivElement>(
			'#game-meta #player-color',
		)!;
		playerColorDiv.innerText = `You play ${this.playerColor}.`;

		this.board!.set({
			viewOnly: true,
			fen: payload.fen,
			turnColor: payload.whosNext,
			orientation: this.playerColor,
			movable: {
				dests: this.toValidMoves(payload.validMoves),
				color: this.playerColor,
			},
			premovable: {
				enabled: true,
				showDests: true,
			},
			draggable: {
				enabled: true,
			},
		} as ChessgroundConfig);
	}

	private sendPremoveMessage(p: Move): void {
		console.log('sendPremoveMessage: ', { premove: p });
		if (this.connection) {
			const premove: ToMessage<PremoveToServer> = {
				type: 'PreMoveToServerType',
				gameId: this.gameId!,
				playerColor: this.playerColor!,
				payload: {
					premove: p,
				},
			};
			this.sendMessage(premove);
		} else {
			throw new Error('connection is undefined.');
		}
	}

	private handleClientMove() {
		const self = this;
		return function (
			from: cg.Key,
			to: cg.Key,
			meta: cg.MoveMetadata,
		): void {
			console.log('Handle move: ', { from, to });
			// handle promotion here; autopromote to queen for now
			to = self.checkIsPromotion(to);
			// premove is set here
			self.board!.move(from, to);

			const move: { from: cg.Key; to: cg.Key } = { from, to };
			if (self.connection) {
				const moveMessage: ToMessage<MoveToServer> = {
					payload: { move },
					playerColor: self.playerColor!,
					gameId: self.gameId!,
					type: 'MoveToServerType',
				};
				self.sendMessage(moveMessage);
			}
			console.log({ state: self.board!.state });
			self.board!.set({
				turnColor: self.playerColor === 'white' ? 'black' : 'white',
				movable: {
					color: self.playerColor,
				},
				premovable: {
					enabled: true,
				},
			});
		};
	}

	private checkIsPromotion(to: cg.Key): cg.Key {
		const movedPiece = this.board!.state.pieces.get(to);
		// any pawn move ending in 1 or 8, i.e. last rank
		if (movedPiece?.role === 'pawn' && /(1|8)$/.test(to)) {
			to += 'q';
		}

		return to;
	}
}
