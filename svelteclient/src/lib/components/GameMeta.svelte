<script lang="ts">
	import type { OpponentType, PlayerColor } from '$lib/models/models';
	import { closeSocket, createSocket } from '$lib/socket/socket';
	import { onMount } from 'svelte';
	import {
		gameState,
		isAgainstComputer
	} from '../../store/must-go-faster.store';
	import LoadingSpinner from './LoadingSpinner.svelte';

	let isGameOver = $state(false);
	let isGameInProgress = $state(false);
	let gameResultText = $state('');

	function connect(opponentType: OpponentType) {
        isAgainstComputer.set(opponentType === 'computer');
		gameState.update((state) => ({
			...state!,
			socketStatus: 'connecting'
		}));
		createSocket(opponentType);
		isGameInProgress = true;
		isGameOver = false;
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
		isGameOver = true;
		isGameInProgress = false;
		// TODO: maintain socket for rematches. create new games, not new sockets.
		closeSocket();
	}

	const unsub = gameState.subscribe(function (state) {
		if (state) {
			if (state.type === 'GameOverFromServerType') {
				gameOver(state.outcome!, state.loser!);
			}
		}
	});

	function playComputer(): void {
		if (!isGameInProgress) {
			connect('computer');
		}
	}

	function playHuman(): void {
		if (!isGameInProgress) {
			connect('human');
		}
	}

	onMount(function () {
		return unsub;
	});
</script>

<div class="flex items-center">
	<div class={['border-gray-700', 'text-white']}>
		{#if isGameOver}
			<div
				class={[
					'mb-4',
					'flex',
					'border-b',
					'border-gray-600',
					'pb-2',
					'rounded-lg',
					'border',
					'border-gray-700',
					'bg-gray-800',
					'p-3',
					'text-white',
					'shadow-lg'
				]}
			>
				{gameResultText}
			</div>
		{/if}

		<div class="flex-col gap-2">
			<div class="flex">
				<button
					onclick={() => playComputer()}
					class={[
						'flex',
						'w-full',
						'justify-center',
						'cursor-pointer',
						'items-center',
						'justify-between',
						'rounded-tl-md',
						'rounded-bl-md',
						'border',
						'border-gray-600',
						'bg-gray-700',
						'px-2',
						'py-1',
						'text-sm',
						'transition-all',
						'duration-200',
						'hover:bg-gray-600',
						isGameInProgress && 'opacity-40'
					]}
				>
					{#if $isAgainstComputer && $gameState?.socketStatus === 'connecting'}
						<LoadingSpinner />
					{:else}Play bot
					{/if}
				</button>
				<button
					onclick={() => playHuman()}
					class={[
						'flex',
						'w-full',
						'justify-center',
						'cursor-pointer',
						'items-center',
						'justify-between',
						'rounded-tr-md',
						'rounded-br-md',
						'border',
						'border-gray-600',
						'bg-gray-700',
						'px-2',
						'py-1',
						'text-sm',
						'transition-all',
						'duration-200',
						'hover:bg-gray-600',
						isGameInProgress ? 'opacity-40' : ''
					]}
				>
					{#if !$isAgainstComputer && $gameState?.socketStatus === 'connecting'}
						<LoadingSpinner />
					{:else}Play human
					{/if}</button
				>
			</div>
		</div>
	</div>
</div>
