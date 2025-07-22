<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let whiteTime = 600; // 10 minutes in seconds
	let blackTime = 600;
	let isWhiteTurn = true;
	let isRunning = false;
	let interval: number;

	onMount(() => {
		// Start the clock
		startClock();
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});

	function startClock() {
		isRunning = true;
		interval = setInterval(() => {
			if (isWhiteTurn) {
				whiteTime--;
			} else {
				blackTime--;
			}
		}, 1000);
	}

	function stopClock() {
		isRunning = false;
		if (interval) {
			clearInterval(interval);
		}
	}

	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	function toggleTurn() {
		if (isRunning) {
			return; // Prevent turn changes while clock is running
		}
		isWhiteTurn = !isWhiteTurn;
	}

	function resetClocks() {
		stopClock();
		whiteTime = 600;
		blackTime = 600;
		isWhiteTurn = true;
	}
	function toggleClock() {
		if (isRunning) {
			stopClock();
		} else {
			startClock();
		}
	}
</script>

<div class="mb-4">
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
		<div class="mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
			<h3 class="text-lg font-semibold text-gray-800 dark:text-white">Chess Clocks</h3>
		</div>
		
		<div class="flex flex-col gap-4 mb-4">
			<div class="flex justify-between items-center p-4 rounded-md bg-gray-50 dark:bg-gray-700 border-2 border-transparent transition-all duration-300 {isWhiteTurn ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''}">
				<div class="font-semibold text-gray-700 dark:text-gray-300">White</div>
				<div class="font-mono text-xl font-bold text-gray-900 dark:text-white">{formatTime(whiteTime)}</div>
			</div>
			
			<div class="flex justify-between items-center p-4 rounded-md bg-gray-50 dark:bg-gray-700 border-2 border-transparent transition-all duration-300 {!isWhiteTurn ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''}">
				<div class="font-semibold text-gray-700 dark:text-gray-300">Black</div>
				<div class="font-mono text-xl font-bold text-gray-900 dark:text-white">{formatTime(blackTime)}</div>
			</div>
		</div>
		
		<div class="flex gap-2 flex-wrap">
			<button class="flex-1 min-w-[80px] px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors duration-200" on:click={toggleClock}>
				{isRunning ? 'Pause' : 'Start'}
			</button>
			<button class="flex-1 min-w-[80px] px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors duration-200" on:click={toggleTurn}>
				Toggle Turn
			</button>
			<button class="flex-1 min-w-[80px] px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200" on:click={resetClocks}>
				Reset
			</button>
		</div>
	</div>
</div>

 