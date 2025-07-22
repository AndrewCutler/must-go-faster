import * as cg from 'chessground/types';
import type {
	FromMessage,
	FromPayload,
	GameJoinedFromServer,
	Move,
	MoveToServer,
	OpponentType,
	PlayerColor,
	ToMessage,
	ToPayload
} from '$lib/models/models';
import { writable } from 'svelte/store';

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
	serverTimeStamp: string;
};

export function receiveMessage(message: FromMessage<FromPayload>): void {
	switch (message.type) {
		case 'GameJoinedFromServerType': {
			const copy = message as FromMessage<GameJoinedFromServer>;
			console.log({ copy });
			gameState.update((prev) => ({
				...prev,
				whiteTimeLeft: copy.payload.whiteTimeLeft,
				blackTimeLeft: copy.payload.blackTimeLeft,
				fen: copy.payload.fen,
				whosNext: copy.payload.whosNext,
				validMoves: copy.payload.validMoves,
				serverTimeStamp: copy.serverTimeStamp
			}));
			sessionId.set(copy.sessionId);
			break;
		}
		case 'MoveFromServerType': {
			console.log({ message });
			break;
		}
	}
}
