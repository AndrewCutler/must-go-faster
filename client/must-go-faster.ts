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
	NewGameToServer,
} from './models';

import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';
import {
	BoardElement,
	ConnectButtonElement,
	CountdownContainerElement,
	GameMetaElement,
	GameStatusModalElement,
	TimerElement,
} from './dom';

export class MustGoFaster {
	#sessionId: string | undefined;
	#playerColor: PlayerColor | undefined;
	#timeLeft: number | undefined;
	#timerInterval: number | undefined;
	#config: Config | undefined;
	#connection: WebSocket | undefined;
	#board: ChessgroundApi | undefined;
	#message: Message | undefined;

	setConfig(value: Config) {
		this.#config = value;
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
		this.#board = Chessground(new BoardElement().element!, initialConfig);
		this.#board.set({
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
			new BoardElement()!.enable();
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

		ws.onopen = function (openEvent) {
			console.log('WebSocket opened.', { event: openEvent });
		};

		ws.onerror = function (errorEvent) {
			console.error('WebSocket error.', { event: errorEvent });
		};

		ws.onclose = function (closeEvent) {
			console.log('WebSocket closed.', { event: closeEvent });
		};
		this.#connection = ws;
	}

	private async handleMessage(message: FromMessage<FromPayload>) {
		this.#message = message;

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
		if (!this.#connection) {
			console.error('Connection does not exist.');
			return;
		}

		if (this.#connection.readyState !== this.#connection.OPEN) {
			console.error(
				'Attempted send() on connection that is not open. State: ',
				this.#connection.readyState,
			);
			return;
		}

		try {
			this.#connection.send(JSON.stringify(message));
		} catch (error) {
			console.error('Cannot JSON.stingify message: ', message);
		}
	}

	private async setupGame(): Promise<void> {
		console.log('start: ', { response: this.#message });
		const message = this.#message as FromMessage<GameStartedFromServer>;
		this.setupBoard(message);

		await this.showCountdownToStartGame();
	}

	private enableBoard(): void {
		const payload = (this.#message as FromMessage<GameJoinedFromServer>)
			.payload!;
		this.toggleClock(payload.whosNext);
		this.#board!.set({
			viewOnly: false,
		});
	}

	private updateBoardWithMove(): void {
		const payload = (this.#message! as FromMessage<MoveFromServer>)
			.payload!;
		console.log('move: ', { move: this.#message });
		let gameStatus: GameStatus | 'lost' | 'won' = 'ongoing';
		if (payload.isCheckmated) {
			gameStatus =
				payload.isCheckmated === this.#playerColor ? 'lost' : 'won';
			this.gameOver(gameStatus, 'checkmate');
			this.#timeLeft = 0;
			return;
		}

		this.#timeLeft =
			this.#playerColor === 'white'
				? payload.whiteTimeLeft
				: payload.blackTimeLeft;

		this.toggleClock(payload.whosNext);

		if (this.#board!.state.premovable.current) {
			// send premove message which checks if premove is valid
			// if so, play response on server and send updated fen
			const [from, to] = this.#board!.state.premovable.current;
			this.sendPremoveMessage({ from, to });
			this.#board!.playPremove();
		}

		this.#board!.set({
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
			(this.#message! as FromMessage<TimeoutFromServer>).payload!
				.loser === this.#playerColor
		) {
			status = 'lost';
		}
		this.gameOver(status, 'timeout');
	}

	private abandoned(): void {
		let status: GameStatus = 'won';
		this.gameOver(status, 'abandonment');
		if (this.#connection) {
			this.#connection.close(1000, 'Game abandoned by opponent.');
			this.#connection = undefined;
		}
		// wipe out all game-specific data in class?
	}

	private async showCountdownToStartGame(): Promise<void> {
		return new Promise((resolve) => {
			const countdownDisplay = new CountdownContainerElement();
			countdownDisplay.show();
			let currentSecond = 5;
			const self = this;
			const countdownInterval = window.setInterval(function () {
				if (currentSecond <= 0) {
					window.clearInterval(countdownInterval);
					countdownDisplay.hide();
					if (self.#connection) {
						const gameStartedRequest: ToMessage<GameStartedToServer> =
							{
								type: 'GameStartedToServerType',
								sessionId: self.#sessionId!,
								playerColor: self.#playerColor!,
							};
						self.sendMessage(gameStartedRequest);
					}
					resolve();
				} else {
					countdownDisplay.setCountdownText(currentSecond);
					currentSecond--;
				}
			}, 1000);
		});
	}

	private toggleClock(whosNext: PlayerColor): void {
		// clear previous interval
		window.clearInterval(this.#timerInterval);

		const timerDiv = new TimerElement()!;

		const runClock = whosNext === this.#playerColor;
		if (!runClock) {
			timerDiv.setTime(this.#timeLeft!);
			return;
		}

		const start = new Date();
		const self = this;
		this.#timerInterval = window.setInterval(function () {
			if (!self.#timeLeft) {
				console.log('no time left', self.#timeLeft);
				return;
			}
			const diff = new Date().getTime() - start.getTime();
			const gameClock = self.#timeLeft - diff / 1_000;

			if (gameClock <= 0) {
				window.clearInterval(self.#timerInterval);
				// send message to server to end game/find out the outcome
				if (self.#connection) {
					const timeout: ToMessage<TimeoutToServer> = {
						type: 'TimeoutToServerType',
						sessionId: self.#sessionId!,
						playerColor: self.#playerColor!,
						payload: {
							timeout: true,
						},
					};
					self.sendMessage(timeout);
				}
				return;
			}

			timerDiv.setTime(gameClock);
		}, 10);
	}

	private toValidMoves(moves: { [key: string]: string[] }): cg.Dests {
		const validMoves = new Map<cg.Key, cg.Key[]>();
		for (const [key, value] of Object.entries(moves)) {
			validMoves.set(key as cg.Key, value as cg.Key[]);
		}

		return validMoves;
	}

	private gameOver(
		gameStatus: Omit<GameStatus, 'ongoing' | 'draw'>,
		method: 'timeout' | 'checkmate' | 'resignation' | 'abandonment',
	): void {
		console.log('gameOver: ', { gameStatus, method });
		if (this.#connection) {
			this.#connection.close(1000, 'Game over.');
			this.#connection = undefined;
		}
		const self = this;
		function sendNewGameMessage() {
			// listen for click of modal button
			self.connect();
		}
		// have to add draws
		const modal = new GameStatusModalElement(sendNewGameMessage);
		modal.show();
		modal.setOutcome(gameStatus, method);
	}

	private setupBoard(message: FromMessage<GameStartedFromServer>) {
		this.#sessionId = message.sessionId;
		this.#playerColor = message.playerColor;
		this.#timeLeft = this.#config?.startingTime;

		const payload = message.payload as GameJoinedFromServer;
		const gameMeta = new GameMetaElement();
		gameMeta.show({
			playerColor: this.#playerColor,
			whosNext: payload.whosNext,
		});

		const connectButton = new ConnectButtonElement();
		connectButton.gameJoined();

		this.#board!.set({
			viewOnly: true,
			fen: payload.fen,
			turnColor: payload.whosNext,
			orientation: this.#playerColor,
			movable: {
				dests: this.toValidMoves(payload.validMoves),
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
	}

	private sendPremoveMessage(move: Move): void {
		console.log('sendPremoveMessage: ', { premove: move });
		if (this.#connection) {
			const premove: ToMessage<PremoveToServer> = {
				type: 'PremoveToServerType',
				sessionId: this.#sessionId!,
				playerColor: this.#playerColor!,
				payload: {
					premove: move,
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
			self.#board!.move(from, to);

			const move: { from: cg.Key; to: cg.Key } = { from, to };
			if (self.#connection) {
				const moveMessage: ToMessage<MoveToServer> = {
					payload: { move },
					playerColor: self.#playerColor!,
					sessionId: self.#sessionId!,
					type: 'MoveToServerType',
				};
				self.sendMessage(moveMessage);
			}
			console.log({ state: self.#board!.state });
			self.#board!.set({
				turnColor: self.#playerColor === 'white' ? 'black' : 'white',
				movable: {
					color: self.#playerColor,
				},
				premovable: {
					enabled: true,
				},
			});
		};
	}

	private checkIsPromotion(to: cg.Key): cg.Key {
		const movedPiece = this.#board!.state.pieces.get(to);
		// any pawn move ending in 1 or 8, i.e. last rank
		if (movedPiece?.role === 'pawn' && /(1|8)$/.test(to)) {
			to += 'q';
		}

		return to;
	}
}
