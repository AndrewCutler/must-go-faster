/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
*/

import { Chessground } from 'chessground';
import {
	ChessgroundConfig,
	GameJoinedFromServer,
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
	MustGoFasterState,
} from './models';
import { GAME_CLOCK_DURATION } from './constants';

import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';
import {
	BoardElement,
	ConnectButtonElement,
	CancelButtonElement,
	ResignButtonElement,
	PlayerTypeElement,
	CountdownContainerElement,
	ConnectionStatusElement,
	OpponentStatusElement,
	GameMetaElement,
	GameStatusModalElement,
	GettingStartedElement,
	ControlsElement,
} from './dom';

export class MustGoFaster {
	#state: MustGoFasterState = {};

	constructor() {
		console.log('Initializing MustGoFaster.');
		this.connect = this.connect.bind(this);
		this.cancelPendingGame = this.cancelPendingGame.bind(this);
		this.#state.opponentType = 'computer';
		this.#state.connectionPhase = 'idle';
		this.#state.closeReason = undefined;
		const initialConfig: ChessgroundConfig = {
			movable: {
				free: false,
				color: 'white',
			},
		};
		this.#state.board = Chessground(
			new BoardElement().element!,
			initialConfig,
		);
		this.#state.board.set({
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
		this.#state.wsBaseUrl = process.env.WS_BASE_URL;
		this.#state.apiBaseUrl = process.env.API_BASE_URL;

		new ConnectButtonElement().reset();
		new PlayerTypeElement().show();
		new CancelButtonElement().hide();
		new ResignButtonElement().hide();
		new OpponentStatusElement().clear();
		new ConnectionStatusElement().clear();

		this.ping();
	}

	connect(): void {
		if (
			this.#state.connection &&
			this.#state.connection.readyState !== WebSocket.CLOSED
		) {
			return;
		}
		if (this.#state.connectionPhase !== 'idle') {
			return;
		}

		this.#state.closeReason = undefined;
		this.#state.connectionPhase = 'connecting';
		this.setConnectionUiPending();

		let ws: WebSocket;
		try {
			ws = new WebSocket(
				`${this.#state.wsBaseUrl!}/connect?opponentType=${
					this.#state.opponentType
				}`,
				[],
			);
		} catch (error) {
			this.#state.connectionPhase = 'idle';
			this.#state.closeReason = 'error';
			this.setConnectionUiError(
				'Unable to open a game connection. Please try again.',
			);
			return;
		}
		// console.log('Creating WebSocket.');

		ws.onopen = () => {
			// console.log('WebSocket opened.', { event: openEvent });
			this.#state.connectionPhase = 'pending';
		};

		ws.onerror = () => {
			this.#state.closeReason = 'error';
			this.#state.connectionPhase = 'idle';
			this.#state.connection = undefined;
			this.setConnectionUiError(
				'Unable to start a game. Please try again.',
			);
		};

		ws.onclose = (closeEvent) => {
			// console.log('WebSocket closed.', { event: closeEvent });
			const closeReason = this.#state.closeReason;
			this.#state.connection = undefined;
			this.#state.connectionPhase = 'idle';

			if (closeReason === 'cancel' || closeReason === 'gameover') {
				this.#state.closeReason = undefined;
				return;
			}

			if (closeReason === 'error') {
				this.#state.closeReason = undefined;
				return;
			}

			if (closeEvent.code === 1000 && closeEvent.reason) {
				this.setConnectionUiError(closeEvent.reason);
			} else {
				this.setConnectionUiError(
					'The game connection closed unexpectedly. Please try again.',
					true,
				);
			}
			this.#state.closeReason = 'error';
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

		this.#state.connection = ws;
	}

	cancelPendingGame(): void {
		if (!this.#state.connection) {
			return;
		}
		if (this.#state.connectionPhase === 'active') {
			return;
		}

		this.#state.closeReason = 'cancel';
		this.#state.connectionPhase = 'idle';
		const connection = this.#state.connection;
		this.#state.connection = undefined;
		connection.close(1000, 'Canceled by user.');
		this.resetConnectionUi();
	}

	setOpponentType(type: OpponentType): void {
		this.#state.opponentType = type;
	}

	private async ping() {
		const gettingStarted = new GettingStartedElement();
		try {
			await fetch(`${this.#state.apiBaseUrl!}/ping`);
		} catch (error) {
			console.error(error);
		} finally {
			gettingStarted.hide();
		}
	}

	private async handleMessage(message: FromMessage<FromPayload>) {
		this.#state.message = message;

		// console.log('Handle message: ', { message });
		switch (message.type) {
			case 'GameJoinedFromServerType':
				this.#state.connectionPhase = 'active';
				this.#state.closeReason = undefined;
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
		if (!this.#state.connection) {
			console.error('Connection does not exist.');
			return;
		}

		if (this.#state.connection.readyState !== this.#state.connection.OPEN) {
			console.error(
				'Attempted send() on connection that is not open. State: ',
				this.#state.connection.readyState,
			);
			return;
		}

		try {
			this.#state.connection.send(JSON.stringify(message));
		} catch (error) {
			console.error('Cannot JSON.stingify message: ', message);
		}
	}

	private async setupGame(): Promise<void> {
		// console.log('start: ', { response: this.#state.message });
		const message = this.#state
			.message as FromMessage<GameJoinedFromServer>;
		this.setupBoard(message);
		this.#state.isAgainstComputer = this.#state.message!.isAgainstComputer;
		this.setConnectionUiGameJoined();

		const {
			payload: {
				whiteTimeLeft,
				blackTimeLeft,
				whosNext,
				countdownStartAt,
			} = {},
		} =
			message;
		this.initializeClock(whiteTimeLeft!, blackTimeLeft!);

		await this.showCountdownToStartGame(whosNext!, countdownStartAt!);
	}

	private enableBoard(): void {
		const payload = (
			this.#state.message as FromMessage<GameJoinedFromServer>
		).payload!;
		this.toggleClock(payload.whosNext);
		this.#state.board!.set({
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
		} = (this.#state.message! as FromMessage<MoveFromServer>).payload!;
		let gameStatus: GameStatus = 'ongoing';

		if (isCheckmated) {
			gameStatus =
				isCheckmated === this.#state.playerColor ? 'lost' : 'won';
			this.gameOver(gameStatus, 'checkmate');
			this.#state.whiteTimeLeft = 0;
			this.#state.blackTimeLeft = 0;

			return;
		}

		this.#state.whiteTimeLeft = whiteTimeLeft;
		this.#state.blackTimeLeft = blackTimeLeft;

		this.toggleClock(whosNext);

		if (this.#state.board!.state.premovable.current) {
			// send premove message which checks if premove is valid
			// if so, play response on server and send updated fen
			const [from, to] = this.#state.board!.state.premovable.current;
			this.sendPremoveMessage({ from, to });
			this.#state.board!.playPremove();
		}

		this.#state.board!.set({
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
			(this.#state.message! as FromMessage<TimeoutFromServer>).payload!
				.loser === this.#state.playerColor
		) {
			status = 'lost';
		}
		this.gameOver(status, 'timeout');
	}

	private abandoned(): void {
		let status: GameStatus = 'won';
		this.gameOver(status, 'abandonment');
		if (this.#state.connection) {
			this.#state.connection.close(1000, 'Game abandoned by opponent.');
			this.#state.connection = undefined;
		}
		// wipe out all game-specific data in class?
	}

	// todo: countdown-container should show "You move first/second" above countdown
	private async showCountdownToStartGame(
		whoMovesFirst: PlayerColor,
		countdownStartAt: string,
	): Promise<void> {
		return new Promise((resolve) => {
			const countdownDisplay = new CountdownContainerElement(
				whoMovesFirst,
				this.#state.playerColor!,
			);
			const self = this;
			const startedAt = new Date(countdownStartAt).getTime();
			const beginCountdown = () => {
				let currentSecond = 5;
				countdownDisplay.setCountdownText(currentSecond);
				const countdownInterval = window.setInterval(function () {
					currentSecond--;
					if (currentSecond <= 0) {
						window.clearInterval(countdownInterval);
						countdownDisplay.hide(whoMovesFirst);

						if (self.#state.connection) {
							const gameStartedRequest: ToMessage<GameStartedToServer> =
								{
									type: 'GameStartedToServerType',
									sessionId: self.#state.sessionId!,
									playerColor: self.#state.playerColor!,
									isAgainstComputer:
										self.#state.isAgainstComputer!,
								};
							self.sendMessage(gameStartedRequest);
						}
						resolve();
					} else {
						countdownDisplay.setCountdownText(currentSecond);
					}
				}, 1000);
			};

			const delay = startedAt - Date.now();
			if (delay <= 0) {
				beginCountdown();
				return;
			}

			window.setTimeout(beginCountdown, delay);
		});
	}

	private initializeClock(
		whiteTimeLeft: number,
		blackTimeLeft: number,
	): void {
		if (this.#state.whiteTimer) {
			cancelAnimationFrame(this.#state.whiteTimer);
		}
		if (this.#state.blackTimer) {
			cancelAnimationFrame(this.#state.blackTimer);
		}

		const controlsDiv = new ControlsElement()!;

		controlsDiv.setTime(whiteTimeLeft, blackTimeLeft);
	}

	private toggleClock(whosNext: PlayerColor): void {
		if (this.#state.whiteTimer) {
			cancelAnimationFrame(this.#state.whiteTimer);
		}
		if (this.#state.blackTimer) {
			cancelAnimationFrame(this.#state.blackTimer);
		}
		const controlsDiv = new ControlsElement()!;
		const start = performance.now();
		const self = this;

		if (whosNext === 'white') {
			controlsDiv.setActive('white');
			function updateWhiteTimer(): void {
				if (!self.#state.whiteTimeLeft) {
					return;
				}
				const diff = performance.now() - start;
				const gameClock = self.#state.whiteTimeLeft - diff / 1_000;

				if (gameClock <= 0) {
					// send message to server to end game/find out the outcome
					if (self.#state.connection) {
						const timeout: ToMessage<TimeoutToServer> = {
							type: 'TimeoutToServerType',
							sessionId: self.#state.sessionId!,
							playerColor: self.#state.playerColor!,
							isAgainstComputer: self.#state.isAgainstComputer!,
							payload: {
								timeout: true,
							},
						};
						self.sendMessage(timeout);
					}
					return;
				}

				controlsDiv.setTime(gameClock, self.#state.blackTimeLeft!);
				if (self.#state.whiteTimer) {
					cancelAnimationFrame(self.#state.whiteTimer);
				}
				self.#state.whiteTimer =
					requestAnimationFrame(updateWhiteTimer);
			}
			if (this.#state.whiteTimer) {
				cancelAnimationFrame(this.#state.whiteTimer);
			}
			this.#state.whiteTimer = requestAnimationFrame(updateWhiteTimer);
		} else {
			controlsDiv.setActive('black');
			function updateBlackTimer(): void {
				if (!self.#state.blackTimeLeft) {
					return;
				}
				const diff = performance.now() - start;
				const gameClock = self.#state.blackTimeLeft - diff / 1_000;

				if (gameClock <= 0) {
					// send message to server to end game/find out the outcome
					if (self.#state.connection) {
						const timeout: ToMessage<TimeoutToServer> = {
							type: 'TimeoutToServerType',
							sessionId: self.#state.sessionId!,
							playerColor: self.#state.playerColor!,
							isAgainstComputer: self.#state.isAgainstComputer!,
							payload: {
								timeout: true,
							},
						};
						self.sendMessage(timeout);
					}
					return;
				}

				controlsDiv.setTime(self.#state.whiteTimeLeft!, gameClock);
				if (self.#state.blackTimer) {
					cancelAnimationFrame(self.#state.blackTimer);
				}
				self.#state.blackTimer =
					requestAnimationFrame(updateBlackTimer);
			}
			if (this.#state.blackTimer) {
				cancelAnimationFrame(this.#state.blackTimer);
			}
			this.#state.blackTimer = requestAnimationFrame(updateBlackTimer);
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
		if (this.#state.connection) {
			this.#state.closeReason = 'gameover';
			this.#state.connectionPhase = 'idle';
			this.#state.connection.close(1000, 'Game over.');
			this.#state.connection = undefined;
		}
		new OpponentStatusElement().clear();
		new CancelButtonElement().hide();
		new ResignButtonElement().hide();
		new ConnectionStatusElement().clear();
		const self = this;
		function sendNewGameMessage() {
			// listen for click of modal button
			self.connect();
		}
		// have to add draws
		const modal = new GameStatusModalElement(sendNewGameMessage);
		modal.setOutcome(gameStatus, method);
	}

	private setupBoard(message: FromMessage<GameJoinedFromServer>) {
		this.#state.sessionId = message.sessionId;
		this.#state.playerColor = message.playerColor;
		this.#state.whiteTimeLeft = GAME_CLOCK_DURATION;
		this.#state.blackTimeLeft = GAME_CLOCK_DURATION;

		const payload = message.payload as GameJoinedFromServer;
		const gameMeta = new GameMetaElement({
			playerColor: this.#state.playerColor,
			whosNext: payload.whosNext,
		});

		const connectButton = new ConnectButtonElement();
		connectButton.gameJoined();

		this.#state.board!.set({
			viewOnly: true,
			fen: payload.fen,
			turnColor: payload.whosNext,
			orientation: this.#state.playerColor,
			movable: {
				dests: this.toValidMoves(payload.validMoves),
				color: this.#state.playerColor,
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

	private setConnectionUiPending(): void {
		const connectButton = new ConnectButtonElement();
		const cancelButton = new CancelButtonElement();
		const playerType = new PlayerTypeElement();
		const status = new ConnectionStatusElement();
		const opponentStatus = new OpponentStatusElement();

		connectButton.setPending();
		cancelButton.show();
		playerType.hide();
		opponentStatus.show(
			`Playing ${this.#state.opponentType ?? 'computer'}`,
		);
		status.show(
			this.#state.opponentType === 'computer'
				? 'Starting game...'
				: 'Waiting for opponent...',
			'info',
		);
	}

	private setConnectionUiGameJoined(): void {
		const playerType = new PlayerTypeElement();
		const opponentStatus = new OpponentStatusElement();

		new CancelButtonElement().hide();
		new ResignButtonElement().show();
		playerType.hide();
		opponentStatus.show(`Playing ${this.#state.opponentType ?? 'computer'}`);
		new ConnectionStatusElement().clear();
		new ConnectButtonElement().gameJoined();
	}

	private setConnectionUiError(
		message: string,
		resetOpponentType = false,
	): void {
		const connectButton = new ConnectButtonElement();
		const cancelButton = new CancelButtonElement();
		const resignButton = new ResignButtonElement();
		const playerType = new PlayerTypeElement();
		const opponentStatus = new OpponentStatusElement();
		const status = new ConnectionStatusElement();

		connectButton.reset();
		cancelButton.hide();
		resignButton.hide();
		if (resetOpponentType) {
			this.#state.opponentType = 'computer';
			playerType.setSelection('computer');
		}
		playerType.show();
		opponentStatus.clear();
		status.show(message, 'error');
	}

	private resetConnectionUi(): void {
		const connectButton = new ConnectButtonElement();
		const cancelButton = new CancelButtonElement();
		const resignButton = new ResignButtonElement();
		const playerType = new PlayerTypeElement();
		const opponentStatus = new OpponentStatusElement();
		const status = new ConnectionStatusElement();

		connectButton.reset();
		cancelButton.hide();
		resignButton.hide();
		playerType.show();
		opponentStatus.clear();
		status.clear();
	}

	private sendPremoveMessage(move: Move): void {
		// console.log('sendPremoveMessage: ', { premove: move });
		if (this.#state.connection) {
			const premove: ToMessage<PremoveToServer> = {
				type: 'PremoveToServerType',
				sessionId: this.#state.sessionId!,
				playerColor: this.#state.playerColor!,
				isAgainstComputer: this.#state.isAgainstComputer!,
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
			self.#state.board!.move(from, to);

			const move: { from: cg.Key; to: cg.Key } = { from, to };
			if (self.#state.connection) {
				const moveMessage: ToMessage<MoveToServer> = {
					payload: { move },
					playerColor: self.#state.playerColor!,
					sessionId: self.#state.sessionId!,
					type: 'MoveToServerType',
					isAgainstComputer: self.#state.isAgainstComputer!,
				};
				self.sendMessage(moveMessage);
			}
			// console.log({ state: self.#state.board!.state });
			self.#state.board!.set({
				turnColor:
					self.#state.playerColor === 'white' ? 'black' : 'white',
				movable: {
					color: self.#state.playerColor,
				},
				premovable: {
					enabled: true,
				},
			});
		};
	}

	private checkIsPromotion(to: cg.Key): cg.Key {
		const movedPiece = this.#state.board!.state.pieces.get(to);
		// any pawn move ending in 1 or 8, i.e. last rank
		if (movedPiece?.role === 'pawn' && /(1|8)$/.test(to)) {
			to += 'q';
		}

		return to;
	}
}
