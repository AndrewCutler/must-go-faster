<script lang="ts">
	import type { ChessgroundConfig } from '$lib/models/models';
	import { Chessground } from 'chessground';
	import { onMount } from 'svelte';
	import * as cg from 'chessground/types';
	import type { Api } from 'chessground/api';
	import {
		gameState,
		isAgainstComputer,
		playerColor,
		sessionId
	} from '../../store/must-go-faster.store';
	import { sendMessage } from '$lib/socket/socket';
	import Page from '../../routes/+page.svelte';
	import { toValidMoves } from '$lib/utils/utils';

	const initialConfig: ChessgroundConfig = {
		movable: {
			free: false,
			color: 'white'
		}
	};

	let board: Api | undefined;
	let boardDiv: HTMLElement | undefined;

	function promoteIfPromotion(to: cg.Key): cg.Key {
		const movedPiece = board!.state.pieces.get(to);
		// any pawn move ending in 1 or 8, i.e. last rank
		if (movedPiece?.role === 'pawn' && /(1|8)$/.test(to)) {
			to += 'q';
		}

		return to;
	}

	function handleClientMove(from: cg.Key, to: cg.Key, meta: cg.MoveMetadata): void {
		// console.log('Handle move: ', { from, to });
		// handle promotion here; autopromote to queen for now
		to = promoteIfPromotion(to);
		// premove is set here
		board!.move(from, to);

		const move: { from: cg.Key; to: cg.Key } = { from, to };
		sendMessage({
			type: 'move',
			move,
			playerColor: $playerColor,
			sessionId: $sessionId,
			isAgainstComputer: $isAgainstComputer
		});

		board!.set({
			turnColor: $playerColor === 'white' ? 'black' : 'white',
			movable: {
				color: $playerColor
			},
			premovable: {
				enabled: true
			}
		});
	}

	const unsub = gameState.subscribe(function (state) {
		// console.log(state);
		if (state) {
			// debug
			// console.log('sending gameStarted');
			sendMessage({
				type: 'gameStarted',
				playerColor: $playerColor,
				sessionId: $sessionId,
				isAgainstComputer: $isAgainstComputer
			});
			const { fen, whosNext: turnColor, validMoves } = state;
			// do not set state here like this; receive it from gameState
			board?.set({
				// viewOnly: true, // todo: set up countdown
				fen,
				turnColor,
				movable: {
					dests: toValidMoves(validMoves),
					color: $playerColor
				},
				orientation: $playerColor,
				premovable: {
					enabled: true,
					showDests: true
				},
				draggable: {
					enabled: true
				}
			});
		}
	});

	onMount(() => {
		if (boardDiv) {
			board = Chessground(boardDiv, initialConfig);

			board.set({
				viewOnly: false,
				// fen: 'rnb1kb1r/pppp1ppp/8/4P3/3P4/2N5/PPP2PPP/R1BQKB1R b KQkq - 0 1',
				movable: {
					dests: new Map<cg.Key, cg.Key[]>([['e2', ['e4']]]),
					events: {
						after: handleClientMove
						// after: this.handleClientMove()
					}
				},
				premovable: {
					enabled: true,
					showDests: true
				},
				predroppable: {
					enabled: true
				},
				draggable: {
					enabled: true
				}
			});
		}

		return unsub;
	});
</script>

<div class="chess-board">
	<div id="board" bind:this={boardDiv}></div>
</div>

<style>
	#board {
		width: 400px;
		height: 400px;
		margin: 0 auto;
	}
</style>
