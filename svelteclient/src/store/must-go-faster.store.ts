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

// todo: why isn't this in gameState god store
export const opponentType = writable<OpponentType | undefined>();
export const isAgainstComputer = writable(false);
export const gameState = writable<GameState | undefined>();

export type GameState = {
	whiteTimeLeft: number;
	blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
	serverTimeStamp: string;
	boardConfig: CGConfig;
	sessionId: string;
	type: FromMessage<FromPayload>['type'];
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
			gameState.update((value) => ({
				...value,
				socketStatus: 'connected',
				type: message.type,
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
					// premovable: {
					// 	enabled: true,
					// 	showDests: true
					// },
					draggable: {
						enabled: true
					}
				}
			}));
			break;
		}
		case 'MoveFromServerType': {
			const copy = message as FromMessage<MoveFromServer>;
			gameState.update((value) => ({
				...(value || {}),
				socketStatus: value?.socketStatus ?? 'disconnected',
				type: message.type,
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
					// premovable: {
					// 	enabled: true,
					// 	showDests: true
					// },
					draggable: {
						enabled: true
					}
				}
			}));
			break;
		}
		case 'GameOverFromServerType': {
			const copy = message as FromMessage<GameOverFromServerType>;
			gameState.update((value) => ({
				...(value || {}),
				socketStatus: 'disconnected',
				type: message.type,
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
