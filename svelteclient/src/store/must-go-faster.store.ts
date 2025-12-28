import type {
	FromMessage,
	FromPayload,
	GameJoinedFromServer,
	GameOverFromServerType,
	Move,
	MoveFromServer,
	OpponentType,
	PlayerColor
} from '$lib/models/models';
import { writable } from 'svelte/store';
import type { CGConfig } from '$lib/models/models';
import { toValidMoves } from '$lib/utils/utils';
import { fenToBoard } from '../fenToBoard';

// todo: why isn't this in gameState god store
// export const opponentType = writable<OpponentType | undefined>();
export const isAgainstComputer = writable(false);
export const gameState = writable<GameState | undefined>();

export const enum Action {
	// game joined so start countdown, disable buttons, etc.
	GameJoined = 'game joined',
	// countdown completed so board is now actionable
	GameStarted = 'game started',
	// process move/fen from server and update UI/game state
	ReceiveMove = 'move from server',
	// premove was played; save to state and don't send anything to server
	SetPremove = 'set premove',
	// send premove to server; fires after receiving move from server
	SendPremove = 'send premove',
	// game over state reached
	GameOver = 'game over'
}

export type GameState = {
	action: Action;
	whiteTimeLeft: number;
	blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
	serverTimeStamp: string;
	boardConfig: CGConfig;
	sessionId: string;
	playerColor: PlayerColor;
	loser?: PlayerColor;
	socketStatus: 'disconnected' | 'connecting' | 'connected';
	outcome: 'in-progress' | 'checkmate' | 'timeout' | 'stalemate'; // etc
	move?: Move;
	premove?: Move;
};

export function receiveMessage(message: FromMessage<FromPayload>): void {
	switch (message.type) {
		case 'GameJoinedFromServerType': {
			const copy = message as FromMessage<GameJoinedFromServer>;
			console.log(fenToBoard(copy.payload.fen));
			gameState.update((value) => ({
				...value,
				action: Action.GameJoined,
				socketStatus: 'connected',
				playerColor: copy.playerColor,
				sessionId: copy.sessionId,
				whiteTimeLeft: copy.payload.whiteTimeLeft,
				blackTimeLeft: copy.payload.blackTimeLeft,
				fen: copy.payload.fen,
				whosNext: copy.payload.whosNext,
				validMoves: copy.payload.validMoves,
				serverTimeStamp: copy.serverTimeStamp,
				outcome: 'in-progress',
				boardConfig: {
					viewOnly: true,
					fen: copy.payload.fen,
					turnColor: copy.payload.whosNext === 'white' ? 'white' : 'black',
					orientation: copy.payload.whosNext === 'white' ? 'white' : 'black',
					movable: {
						dests: toValidMoves(copy.payload.validMoves),
						color: copy.payload.whosNext
					},
					draggable: {
						enabled: true
					}
				}
			}));
			break;
		}
		case 'MoveFromServerType': {
			const copy = message as FromMessage<MoveFromServer>;
			gameState.update((value) => {
				let action: Action = Action.ReceiveMove;
				if (value?.premove) {
					console.log('premove: ', value.premove);
					action = Action.SendPremove;
				}

				console.log(fenToBoard(copy.payload.fen));

				return {
					...(value || {}),
					action,
					socketStatus: value?.socketStatus ?? 'disconnected',
					playerColor: copy.playerColor,
					sessionId: copy.sessionId,
					whiteTimeLeft: copy.payload.whiteTimeLeft,
					blackTimeLeft: copy.payload.blackTimeLeft,
					fen: copy.payload.fen,
					whosNext: copy.payload.whosNext,
					validMoves: copy.payload.validMoves,
					serverTimeStamp: copy.serverTimeStamp,
					outcome: 'in-progress',
					boardConfig: {
						fen: copy.payload.fen,
						turnColor: copy.payload.whosNext,
						movable: {
							dests: toValidMoves(copy.payload.validMoves),
							color: copy.playerColor
						},
						lastMove: [copy.payload.move.from, copy.payload.move.to],
						orientation: copy.playerColor,
						draggable: {
							enabled: true
						}
					}
				};
			});
			break;
		}
		case 'GameOverFromServerType': {
			const copy = message as FromMessage<GameOverFromServerType>;
			gameState.update((value) => ({
				...(value || {}),
				action: Action.GameOver,
				socketStatus: 'disconnected',
				playerColor: copy.playerColor,
				sessionId: copy.sessionId,
				whiteTimeLeft: value!.whiteTimeLeft,
				blackTimeLeft: value!.blackTimeLeft,
				fen: value!.fen,
				whosNext: value!.whosNext,
				validMoves: value!.validMoves,
				serverTimeStamp: copy.serverTimeStamp,
				outcome: copy.payload.outcome as any,
				loser: copy.payload.loser,
				boardConfig: {
					lastMove: [copy.payload.move.from, copy.payload.move.to],
					orientation: copy.playerColor
				}
			}));
			break;
		}
	}
}
