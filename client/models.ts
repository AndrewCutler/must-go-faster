export type GameStartedResponse = {
	gameStarted: boolean;
	fen: string;
	gameId: string;
	color: 'white' | 'black';
	validMoves: { [key: string]: string[] };
};

export type MoveResponse = {
	move: any; // todo
	fen: string;
};
