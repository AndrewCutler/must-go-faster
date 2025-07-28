<script lang="ts">
	import type { ChessgroundConfig, PlayerColor } from '$lib/models/models';
	import { Chessground } from 'chessground';
	import { onMount } from 'svelte';
	import * as cg from 'chessground/types';
	import type { Api } from 'chessground/api';
	import {
		gameState,
		isAgainstComputer
	} from '../../store/must-go-faster.store';
	import { sendMessage } from '$lib/socket/socket';

	const initialConfig: ChessgroundConfig = {
		movable: {
			free: false,
			color: 'white'
		}
	};

	let board: Api | undefined;
	let boardDiv: HTMLElement | undefined;
	let countdownInterval: number | undefined = $state(undefined);
	let countdownValue = $state(0);
	let showGameOverDialog = $state(false);
	let gameResultText = $state('');

	function promoteIfPromotion(to: cg.Key): cg.Key {
		const movedPiece = board!.state.pieces.get(to);
		// any pawn move ending in 1 or 8, i.e. last rank
		if (movedPiece?.role === 'pawn' && /(1|8)$/.test(to)) {
			to += 'q';
		}

		return to;
	}

	// TODO: meta tells you if premove
	function handleClientMove(
		from: cg.Key,
		to: cg.Key,
		meta: cg.MoveMetadata
	): void {
		if (!$gameState?.sessionId) {
			console.error('sessionId not found');
			return;
		}
		// handle promotion here; autopromote to queen for now
		to = promoteIfPromotion(to);
		board!.move(from, to);

		const move: { from: cg.Key; to: cg.Key } = { from, to };
		sendMessage({
			type: 'MoveToServerType',
			move,
			playerColor: $gameState.playerColor,
			sessionId: $gameState.sessionId,
			isAgainstComputer: $isAgainstComputer
		});

		board!.set({
			turnColor: $gameState.playerColor === 'white' ? 'black' : 'white',
			movable: {
				color: $gameState.playerColor
			},
			premovable: {
				enabled: true
			}
		});
	}

	const unsub = gameState.subscribe(function (state) {
		if (state) {
			if (!state.sessionId) {
				console.error('sessionId not found');
				return;
			}

			if (state.type === 'GameJoinedFromServerType') {
				startCountdown();
			} else if (state.type === 'GameOverFromServerType') {
				console.log(state);
				gameOver(state.outcome!, state.loser!);
			}

			board?.set({
				...state.boardConfig
			});
		}
	});

	onMount(() => {
		if (boardDiv) {
			board = Chessground(boardDiv, initialConfig);

			board.set({
				viewOnly: false,
				movable: {
					events: {
						after: handleClientMove
					}
				},
				// events: {
				// 	move: function (from: cg.Key, to: cg.Key, captured: cg.Piece | undefined) {
				// 	}
				// },
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

	function startCountdown(): void {
		if ($gameState?.sessionId && $gameState?.playerColor) {
			countdownValue = 5;
			countdownInterval = setInterval(function () {
				--countdownValue;
				if (countdownValue <= 0) {
					gameState.update((state) => ({
						...state!,
						type: 'GameStartedToServerType'
					}));
					sendMessage({
						type: 'GameStartedToServerType',
						playerColor: $gameState?.playerColor,
						sessionId: $gameState.sessionId,
						isAgainstComputer: $isAgainstComputer
					});
					board?.set({
						viewOnly: false,
						movable: {
							dests: board.state.movable.dests,
							color: board.state.movable.color
						},
						draggable: {
							enabled: true
						}
					});
					clearInterval(countdownInterval);
				}
			}, 1000);
		} else {
			console.log($gameState?.sessionId, $gameState?.playerColor);
		}
	}

	// todo: better types
	function gameOver(
		gameState: 'timeout' | 'checkmate' | 'stalemate' | 'in-progress',
		loser: PlayerColor
	): void {
		gameResultText = `${loser
			.split('')
			.map((l, i) => (i === 0 ? l.toUpperCase() : l))
			.join('')} lost due to ${gameState}.`;
		showGameOverDialog = true;
	}
</script>

<div class="chess-board">
	<div
		id="countdown-timer"
		class={[
			countdownValue ? ' block' : 'hidden',
			'absolute',
			'top-1/2',
			'left-1/2',
			'-translate-1/2',
			'font-black',
			'text-8xl',
			'z-20'
		]}
	>
		{countdownValue}
	</div>
	<div id="board" bind:this={boardDiv}></div>
	<dialog
		open={showGameOverDialog}
		class="-translate-z-2 absolute left-1/3 top-1/4 z-10 rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-lg"
	>
		<div class={['flex-col', 'font-medium', 'text-gray-300']}>
			<div class="mb-4 flex border-b border-gray-600 pb-2">
				{gameResultText}
			</div>
			<div class="mb-4 flex border-b border-gray-600 pb-2">
				<button
					class={[
						'inline-flex',
						'items-center',
						'rounded-md',
						'border',
						'border-gray-600',
						'px-4',
						'py-2',
						'text-sm',
						'font-medium',
						'text-gray-200',
						'shadow-sm',
						'transition-colors',
						'duration-150',
						'hover:bg-gray-600',
						'focus:outline-none',
						'focus:ring-2',
						'focus:ring-blue-500',
						'focus:ring-offset-2'
					]}
					onclick={() => location.reload()}
				>
					Play again
				</button>[dropdown for opponent type]
			</div>
		</div>
	</dialog>
</div>

<style>
	.chess-board {
		position: relative;
	}

	#board {
		width: 400px;
		height: 400px;
		margin: 0 auto;
	}
</style>
