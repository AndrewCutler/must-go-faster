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
import {
	BoardElement,
	ConnectButtonElement,
	CountdownContainerElement,
	GameMetaElement,
	GameStatusModalElement,
	TimerElement,
} from './dom';

export class MustGoFaster {
	private _gameId: string | undefined;
	private _playerColor: PlayerColor | undefined;
	private _timeLeft: number | undefined;
	private _gameClock: number | undefined;
	private _timerInterval: number | undefined;
	private _config: Config | undefined;
	private _connection: WebSocket | undefined;
	private _board: ChessgroundApi | undefined;
	private _message: Message | undefined;

	setConfig(value: Config) {
		this._config = value;
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
		this._board = Chessground(new BoardElement().element!, initialConfig);
		this._board.set({
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
		this._connection = ws;
	}

	private async handleMessage(message: FromMessage<FromPayload>) {
		this._message = message;

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
		if (!this._connection) {
			console.error('Attempted send() on closed connection.');
			return;
		}

		try {
			this._connection.send(JSON.stringify(message));
		} catch (error) {
			console.error('Cannot JSON.stingify message: ', message);
		}
	}

	private async setupGame(): Promise<void> {
		console.log('start: ', { response: this._message });
		const message = this._message as FromMessage<GameStartedFromServer>;
		this.setupBoard(message);
		console.log(this._board!.state);

		await this.showCountdownToStartGame();
	}

	private enableBoard(): void {
		this.setTimer();
		this._board!.set({
			viewOnly: false,
		});
	}

	private updateBoardWithMove(): void {
		const payload = (this._message! as FromMessage<MoveFromServer>)
			.payload!;
		console.log('move: ', { move: this._message });
		let gameStatus: GameStatus | 'lost' | 'won' = 'ongoing';
		if (payload.isCheckmated) {
			gameStatus =
				payload.isCheckmated === this._playerColor ? 'lost' : 'won';
			this.gameOver(gameStatus, 'checkmate');
			this._gameClock = 0;
			return;
		}

		this._timeLeft =
			this._playerColor === 'white'
				? payload.whiteTimeLeft
				: payload.blackTimeLeft;
		this.setTimer();

		if (this._board!.state.premovable.current) {
			// send premove message which checks if premove is valid
			// if so, play response on server and send updated fen
			const [from, to] = this._board!.state.premovable.current;
			this.sendPremoveMessage({ from, to });
			this._board!.playPremove();
		}

		this._board!.set({
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
			(this._message! as FromMessage<TimeoutFromServer>).payload!
				.loser === this._playerColor
		) {
			status = 'lost';
		}
		this.gameOver(status, 'timeout');
	}

	private abandoned(): void {
		let status: GameStatus = 'won';
		this.gameOver(status, 'abandonment');
		if (this._connection) {
			this._connection.close();
		}
		// wipe out all game-specific data in class
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
					if (self._connection) {
						const gameStartedRequest: ToMessage<GameStartedToServer> =
							{
								type: 'GameStartedToServerType',
								gameId: self._gameId!,
								playerColor: self._playerColor!,
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

	private setTimer(): void {
		// clear previous interval
		window.clearInterval(this._timerInterval);

		const timerDiv = new TimerElement()!;
		const start = new Date();
		const self = this;
		this._timerInterval = window.setInterval(function () {
			if (!self._timeLeft) {
				console.log('no time left', self._timeLeft);
				return;
			}
			if ((self._gameClock ?? 0) <= 0) {
				window.clearInterval(self._timerInterval);
				// send message to server to end game/find out the outcome
				if (self._connection) {
					const timeout: ToMessage<TimeoutToServer> = {
						type: 'TimeoutToServerType',
						gameId: self._gameId!,
						playerColor: self._playerColor!,
						payload: {
							timeout: true,
						},
					};
					self.sendMessage(timeout);
				}
				return;
			}
			const diff = new Date().getTime() - start.getTime();
			self._gameClock = self._timeLeft - diff / 1_000;

			timerDiv.setTime(self._gameClock);
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
		// have to add draws
		const modal = new GameStatusModalElement();
		modal.show();
		modal.setOutcome(gameStatus, method);
	}

	private setupBoard(message: FromMessage<GameStartedFromServer>) {
		this._gameId = message.gameId;
		this._playerColor = message.playerColor;
		this._timeLeft = this._gameClock = this._config?.startingTime;

		const payload = message.payload as GameJoinedFromServer;
		const gameMeta = new GameMetaElement();
		gameMeta.show({
			playerColor: this._playerColor,
			whosNext: payload.whosNext,
		});

		const connectButton = new ConnectButtonElement();
		connectButton.gameJoined();

		this._board!.set({
			viewOnly: true,
			fen: payload.fen,
			turnColor: payload.whosNext,
			orientation: this._playerColor,
			movable: {
				dests: this.toValidMoves(payload.validMoves),
				color: this._playerColor,
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
		if (this._connection) {
			const premove: ToMessage<PremoveToServer> = {
				type: 'PreMoveToServerType',
				gameId: this._gameId!,
				playerColor: this._playerColor!,
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
			self._board!.move(from, to);

			const move: { from: cg.Key; to: cg.Key } = { from, to };
			if (self._connection) {
				const moveMessage: ToMessage<MoveToServer> = {
					payload: { move },
					playerColor: self._playerColor!,
					gameId: self._gameId!,
					type: 'MoveToServerType',
				};
				self.sendMessage(moveMessage);
			}
			console.log({ state: self._board!.state });
			self._board!.set({
				turnColor: self._playerColor === 'white' ? 'black' : 'white',
				movable: {
					color: self._playerColor,
				},
				premovable: {
					enabled: true,
				},
			});
		};
	}

	private checkIsPromotion(to: cg.Key): cg.Key {
		const movedPiece = this._board!.state.pieces.get(to);
		// any pawn move ending in 1 or 8, i.e. last rank
		if (movedPiece?.role === 'pawn' && /(1|8)$/.test(to)) {
			to += 'q';
		}

		return to;
	}
}
