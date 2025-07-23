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

// todo: why isn't this in gameState
export const playerColor = writable<PlayerColor>('white');
export const opponentType = writable<OpponentType>();
export const isAgainstComputer = writable(false);
export const sessionId = writable<string>();
export const gameState = writable<GameState>();

export type GameState = {
	whiteTimeLeft: number;
	blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
	isCheckmated: PlayerColor;
	move: Move;
	playerColor: PlayerColor;
	serverTimeStamp: string;
	boardConfig: CGConfig;
};

export function receiveMessage(message: FromMessage<FromPayload>): void {
	switch (message.type) {
		case 'GameJoinedFromServerType': {
			const copy = message as FromMessage<GameJoinedFromServer>;
			// console.log({ copy });
			gameState.update((prev) => ({
				...prev,
				whiteTimeLeft: copy.payload.whiteTimeLeft,
				blackTimeLeft: copy.payload.blackTimeLeft,
				fen: copy.payload.fen,
				whosNext: copy.payload.whosNext,
				validMoves: copy.payload.validMoves,
				serverTimeStamp: copy.serverTimeStamp,
				boardConfig: {
					// viewOnly: true, // todo: set up countdown
					fen: copy.payload.fen,
					turnColor: copy.payload.whosNext,
					movable: {
						dests: toValidMoves(copy.payload.validMoves),
						color: prev?.playerColor ?? playerColor
					},
					orientation: prev?.playerColor ?? playerColor,
					premovable: {
						enabled: true,
						showDests: true
					},
					draggable: {
						enabled: true
					}
				}
			}));
			sessionId.set(copy.sessionId);
			break;
		}
		case 'MoveFromServerType': {
			console.log({ message });
            const copy = message as FromMessage<MoveFromServer>;
			// console.log({ copy });
			gameState.update((prev) => ({
				...prev,
				whiteTimeLeft: copy.payload.whiteTimeLeft,
				blackTimeLeft: copy.payload.blackTimeLeft,
				fen: copy.payload.fen,
				whosNext: copy.payload.whosNext,
				validMoves: copy.payload.validMoves,
				serverTimeStamp: copy.serverTimeStamp,
				boardConfig: {
					// viewOnly: true, // todo: set up countdown
					fen: copy.payload.fen,
					turnColor: copy.payload.whosNext,
					movable: {
						dests: toValidMoves(copy.payload.validMoves),
						color: prev?.playerColor ?? playerColor
					},
					orientation: prev?.playerColor ?? playerColor,
					premovable: {
						enabled: true,
						showDests: true
					},
					draggable: {
						enabled: true
					}
				}
			}));
			// sessionId.set(copy.sessionId);
			break;
		}
	}
}
