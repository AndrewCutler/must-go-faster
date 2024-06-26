import * as cg from 'chessground/types.js';
import { Config as CGConfig } from 'chessground/config';

export type PlayerColor = 'white' | 'black';

export type GameStatus = 'ongoing' | 'lost' | 'won' | 'draw';

export type MessageType =
	| 'GameJoinedFromServerType'
	| 'GameStartedFromServerType'
	| 'MoveFromServerType'
	| 'PremoveFromServerType'
	| 'TimeoutFromServerType'
	| 'AbandonedFromServerType'
	| 'GameJoinedToServerType'
	| 'GameStartedToServerType'
	| 'MoveToServerType'
	| 'PremoveToServerType'
	| 'TimeoutToServerType'
	| 'AbandonedToServerType';

export type Message = {
	gameId: string;
	playerColor: PlayerColor;
	type: MessageType;
};

export type ToMessage<T extends ToPayload> = Message & {
	payload?: T;
};

export type FromMessage<T extends FromPayload> = Message & {
	payload?: T;
};

export type ToPayload =
	| GameJoinedFromServer
	| GameStartedFromServer
	| GameStartedToServer
	| MoveToServer
	| PremoveToServer
	| TimeoutToServer;

export type FromPayload =
	| GameJoinedFromServer
	| GameStartedFromServer
	| MoveFromServer
	| TimeoutFromServer
	| AbandonedFromServer;

export type GameJoinedFromServer = {
	whiteTimeLeft: number;
	blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
};

export type GameStartedFromServer = GameJoinedFromServer;

export type GameStartedToServer = undefined;

export type MoveFromServer = {
	whiteTimeLeft: number;
	blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
	isCheckmated: PlayerColor;
};

export type TimeoutFromServer = {
	// whiteTimeLeft: number;
	// blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
	loser: PlayerColor;
};

export type AbandonedFromServer = {
	abandoned: boolean;
};

export type TimeoutToServer = {
	timeout: boolean;
};

export type MoveToServer = { move: Move; };

export type PremoveToServer = {
	premove: Move;
};

export type Move = {
	from: cg.Key;
	to: cg.Key;
};

export type Config = {
	startingTime: number;
	chainablePremove: boolean;
};

export interface ChessgroundConfig extends CGConfig {
	premovable?: CGConfig['premovable'] & { current?: string[] };
}
