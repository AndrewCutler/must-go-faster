import * as cg from 'chessground/types';
import type {
	FromMessage,
	FromPayload,
	GameJoinedFromServer,
	Move,
	MoveFromServer,
	MoveToServer,
	OpponentType,
	PlayerColor,
	ToMessage,
	ToPayload
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
	isCheckmated?: PlayerColor;
	move?: Move;
};

export function receiveMessage(message: FromMessage<FromPayload>): void {
	switch (message.type) {
		case 'GameJoinedFromServerType': {
			const copy = message as FromMessage<GameJoinedFromServer>;
			gameState.update((value) => ({
				...value,
				type: message.type,
				playerColor: copy.playerColor,
				sessionId: copy.sessionId,
				whiteTimeLeft: copy.payload.whiteTimeLeft,
				blackTimeLeft: copy.payload.blackTimeLeft,
				fen: copy.payload.fen,
				whosNext: copy.payload.whosNext,
				validMoves: copy.payload.validMoves,
				serverTimeStamp: copy.serverTimeStamp,
				boardConfig: {
					viewOnly: true,
					fen: copy.payload.fen,
					turnColor: copy.payload.whosNext === 'white' ? 'white' : 'black',
					orientation: copy.payload.whosNext === 'white' ? 'white' : 'black',
					movable: {
						dests: toValidMoves(copy.payload.validMoves),
						color: copy.payload.whosNext
					},
					premovable: {
						enabled: true,
						showDests: true
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
			gameState.update((value) => ({
				...(value || {}),
				type: message.type,
				playerColor: copy.playerColor,
				sessionId: copy.sessionId,
				whiteTimeLeft: copy.payload.whiteTimeLeft,
				blackTimeLeft: copy.payload.blackTimeLeft,
				fen: copy.payload.fen,
				whosNext: copy.payload.whosNext,
				validMoves: copy.payload.validMoves,
				serverTimeStamp: copy.serverTimeStamp,
				boardConfig: {
					viewOnly: true,
					fen: copy.payload.fen,
					turnColor: copy.payload.whosNext,
					movable: {
						dests: toValidMoves(copy.payload.validMoves),
						color: copy.playerColor
					},
					orientation: copy.playerColor,
					premovable: {
						enabled: true,
						showDests: true
					},
					draggable: {
						enabled: true
					}
				}
			}));
			break;
		}
	}
}
