import { Chessground } from 'chessground';
import {
	ChessgroundConfig,
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
	OpponentType,
} from './models';
import { GAME_CLOCK_DURATION } from './constants';

import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';
import {
	BoardElement,
	ConnectButtonElement,
	CountdownContainerElement,
	GameMetaElement,
	GameStatusModalElement,
	GettingStartedElement,
	TimerElement,
} from './dom';

export class MustGoFaster {
	#sessionId: string | undefined;
	#playerColor: PlayerColor | undefined;
	#whiteTimeLeft: number | undefined;
	#blackTimeLeft: number | undefined;
	#whiteTimerInterval: number | undefined;
	#blackTimerInterval: number | undefined;
	#connection: WebSocket | undefined;
	#board: ChessgroundApi | undefined;
	#message: Message | undefined;
	#wsBaseUrl: string | undefined;
	#apiBaseUrl: string | undefined;
	#opponentType: OpponentType;
	#isAgainstComputer = false;

	constructor() {
		// console.log('Initializing MustGoFaster.');
		this.connect = this.connect.bind(this);
		this.#opponentType = 'computer';
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
		this.#wsBaseUrl = process.env.WS_BASE_URL;
		this.#apiBaseUrl = process.env.API_BASE_URL;

		this.ping();
	}

	connect(): void {
		const ws = new WebSocket(
			`${this.#wsBaseUrl!}/connect?opponentType=${this.#opponentType}`,
			[],
		);
		// console.log('Creating WebSocket.');

		ws.onopen = function (openEvent) {
			// console.log('WebSocket opened.', { event: openEvent });
			new BoardElement()!.enable();
		};

		ws.onerror = function (errorEvent) {
			console.error('WebSocket error.', { event: errorEvent });
		};

		ws.onclose = function (closeEvent) {
			// console.log('WebSocket closed.', { event: closeEvent });
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

		this.#connection = ws;
	}

	setOpponentType(type: OpponentType): void {
		this.#opponentType = type;
	}

	private async ping() {
		const gettingStarted = new GettingStartedElement();
		try {
			await fetch(`${this.#apiBaseUrl!}/ping`);
		} catch (error) {
			console.error(error);
		} finally {
			gettingStarted.hide();
		}
	}

	private async handleMessage(message: FromMessage<FromPayload>) {
		this.#message = message;

		// console.log('Handle message: ', { message });
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
		// console.log('start: ', { response: this.#message });
		const message = this.#message as FromMessage<GameStartedFromServer>;
		this.setupBoard(message);
		this.#isAgainstComputer = this.#message!.isAgainstComputer;

		const { payload: { whiteTimeLeft, blackTimeLeft } = {} } = message;
		this.initializeClock(whiteTimeLeft!, blackTimeLeft!);

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
		const {
			isCheckmated,
			whiteTimeLeft,
			blackTimeLeft,
			whosNext,
			fen,
			validMoves,
			move: { from, to },
		} = (this.#message! as FromMessage<MoveFromServer>).payload!;
		// console.log('move: ', { move: this.#message });
		console.log(
			(this.#message as any).payload?.whiteTimeLeft,
			(this.#message as any).payload?.blackTimeLeft,
		);
		let gameStatus: GameStatus = 'ongoing';

		if (isCheckmated) {
			gameStatus = isCheckmated === this.#playerColor ? 'lost' : 'won';
			this.gameOver(gameStatus, 'checkmate');
			this.#whiteTimeLeft = 0;
			this.#blackTimeLeft = 0;

			return;
		}

		this.#whiteTimeLeft = whiteTimeLeft;
		this.#blackTimeLeft = blackTimeLeft;

		this.toggleClock(whosNext);

		if (this.#board!.state.premovable.current) {
			// send premove message which checks if premove is valid
			// if so, play response on server and send updated fen
			const [from, to] = this.#board!.state.premovable.current;
			this.sendPremoveMessage({ from, to });
			this.#board!.playPremove();
		}

		this.#board!.set({
			fen,
			turnColor: whosNext,
			movable: {
				dests: this.toValidMoves(validMoves),
			},
			lastMove: [from, to],
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
								isAgainstComputer: self.#isAgainstComputer,
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

	private initializeClock(
		whiteTimeLeft: number,
		blackTimeLeft: number,
	): void {
		window.clearInterval(this.#whiteTimerInterval);
		window.clearInterval(this.#blackTimerInterval);

		const timerDiv = new TimerElement()!;

		timerDiv.setTime(whiteTimeLeft, blackTimeLeft);
	}

	private toggleClock(whosNext: PlayerColor): void {
		// clear previous intervals
		window.clearInterval(this.#whiteTimerInterval);
		window.clearInterval(this.#blackTimerInterval);

		const timerDiv = new TimerElement()!;
		const start = performance.now();
		const self = this;

		if (whosNext === 'white') {
			function updateWhiteTimer(): void {
				if (!self.#whiteTimeLeft) {
					return;
				}
				const diff = performance.now() - start;
				const gameClock = self.#whiteTimeLeft - diff / 1_000;

				if (gameClock <= 0) {
					// send message to server to end game/find out the outcome
					if (self.#connection) {
						const timeout: ToMessage<TimeoutToServer> = {
							type: 'TimeoutToServerType',
							sessionId: self.#sessionId!,
							playerColor: self.#playerColor!,
							isAgainstComputer: self.#isAgainstComputer,
							payload: {
								timeout: true,
							},
						};
						self.sendMessage(timeout);
					}
					return;
				}

				timerDiv.setTime(gameClock, self.#blackTimeLeft!);
				self.#whiteTimerInterval =
					requestAnimationFrame(updateWhiteTimer);
			}
			this.#whiteTimerInterval = requestAnimationFrame(updateWhiteTimer);
		} else {
			function updateBlackTimer(): void {
				if (!self.#blackTimeLeft) {
					return;
				}
				const diff = performance.now() - start;
				const gameClock = self.#blackTimeLeft - diff / 1_000;

				if (gameClock <= 0) {
					// send message to server to end game/find out the outcome
					if (self.#connection) {
						const timeout: ToMessage<TimeoutToServer> = {
							type: 'TimeoutToServerType',
							sessionId: self.#sessionId!,
							playerColor: self.#playerColor!,
							isAgainstComputer: self.#isAgainstComputer,
							payload: {
								timeout: true,
							},
						};
						self.sendMessage(timeout);
					}
					return;
				}

				timerDiv.setTime(self.#whiteTimeLeft!, gameClock);
				self.#blackTimerInterval =
					requestAnimationFrame(updateBlackTimer);
			}
			this.#blackTimerInterval = requestAnimationFrame(updateBlackTimer);
		}
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
		// console.log('gameOver: ', { gameStatus, method });
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
		modal.setOutcome(gameStatus, method);
	}

	private setupBoard(message: FromMessage<GameStartedFromServer>) {
		this.#sessionId = message.sessionId;
		this.#playerColor = message.playerColor;
		this.#whiteTimeLeft = GAME_CLOCK_DURATION;
		this.#blackTimeLeft = GAME_CLOCK_DURATION;

		const payload = message.payload as GameJoinedFromServer;
		const gameMeta = new GameMetaElement({
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
		// console.log('sendPremoveMessage: ', { premove: move });
		if (this.#connection) {
			const premove: ToMessage<PremoveToServer> = {
				type: 'PremoveToServerType',
				sessionId: this.#sessionId!,
				playerColor: this.#playerColor!,
				isAgainstComputer: this.#isAgainstComputer,
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
			// console.log('Handle move: ', { from, to });
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
					isAgainstComputer: self.#isAgainstComputer,
				};
				self.sendMessage(moveMessage);
			}
			// console.log({ state: self.#board!.state });
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
