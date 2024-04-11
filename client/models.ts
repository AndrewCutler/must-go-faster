export type PlayerColor = 'white' | 'black';

export type GameStatus = 'ongoing' | 'lost' | 'won' | 'draw';

export type BaseResponse = {
	fen: string;
	gameId: string;
	whosNext: PlayerColor;
	playerColor: PlayerColor;
	validMoves: { [key: string]: string[] };
	isCheckmated: PlayerColor | '';
    timeLeft: number;
};

export type GameStartedResponse = BaseResponse & {
	gameStarted: boolean;
};

export function isGameStartedResponse(obj: any): obj is GameStartedResponse {
	return obj.gameStarted !== undefined;
}

export class Timer {
	timeLeft: number;

	constructor(value: number) {
		this.timeLeft = value;
	}
}
