import * as cg from 'chessground/types.js';

export type PlayerColor = 'white' | 'black';

export type GameStatus = 'ongoing' | 'lost' | 'won' | 'draw';

type BaseResponse = {
	fen: string;
	gameId: string;
	whosNext: PlayerColor;
	playerColor: PlayerColor;
};

export type MoveResponse = BaseResponse & {
	validMoves: { [key: string]: string[] };
	isCheckmated: PlayerColor | '';
	timeLeft: number;
};

export type GameStartedResponse = Omit<MoveResponse, 'isCheckmated'> & {
	gameStarted: boolean;
};

export type TimeoutResponse = BaseResponse & {
	loser: PlayerColor;
};

export function isGameStartedResponse(obj: any): obj is GameStartedResponse {
	return obj.gameStarted !== undefined;
}

export function isMoveResponse(obj: any): obj is MoveResponse {
	return obj.validMoves !== undefined && obj.gameStarted === undefined;
}

export function isTimeoutResponse(obj: any): obj is TimeoutResponse {
	return obj.loser !== undefined;
}

export type Move = {
	from: cg.Key;
	to: cg.Key;
};

type WithGameId = {
	gameId: string;
};

export type MoveRequest = {
	move: Move;
} & WithGameId;

export type TimeoutRequest = {
	timeout: true;
	playerColor: PlayerColor;
} & WithGameId;
