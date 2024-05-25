import * as cg from 'chessground/types.js';
import { Config as CGConfig } from 'chessground/config';

export type PlayerColor = 'white' | 'black';

export type GameStatus = 'ongoing' | 'lost' | 'won' | 'draw';

export type MessageType =
	| 'GameJoinedType'
	| 'GameStartedType'
	| 'MoveType'
	| 'PremoveType'
	| 'TimeoutType'
	| 'AbandonedType';

export type Message<T extends Payload> = {
	gameId: string;
	playerColor: PlayerColor;
	payload?: T;
	type: MessageType;
	// fen: string;
	// whosNext: PlayerColor;
};

export type Payload =
	| GameJoinedIncoming
	| GameStartedIncoming
	| TimeoutIncoming
	| MoveIncoming
	| AbandonedIncoming
	| TimeoutOutgoing
	| PremoveOutgoing
	| MoveOutgoing;

export type GameJoinedIncoming = {
	whiteTimeLeft: number;
	blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
};

export type GameStartedIncoming = GameJoinedIncoming;

export type MoveIncoming = {
	whiteTimeLeft: number;
	blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
	isCheckmated: PlayerColor;
};

export type TimeoutIncoming = {
	whiteTimeLeft: number;
	blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
	loser: PlayerColor;
};

export type AbandonedIncoming = {
	abandoned: boolean;
};

export type TimeoutOutgoing = {
	timeout: boolean;
};

export type PremoveOutgoing = {
	premove: Move;
};

export type MoveOutgoing = {
	move: Move;
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
