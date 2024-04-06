export type GameStartedResponse = {
	gameStarted: boolean;
	fen: string;
	color: 'white' | 'black';
	validMoves: { [key: string]: string[] };
};

export type MoveResponse = {
	move: any; // todo
	fen: string;
};
