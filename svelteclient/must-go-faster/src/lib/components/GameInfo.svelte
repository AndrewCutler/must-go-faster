<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let { currentTurn = 'Black', gameStatus = 'Waiting to start...' } = $props();

	function toggleTurn() {
		dispatch('move');
	}
</script>

<div class="mb-4">
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
		<div class="mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
			<h3 class="text-lg font-semibold text-gray-800 dark:text-white">Game Status</h3>
		</div>
		
		<div class="mb-4">
			<div class="flex justify-between items-center mb-3 py-2">
				<span class="font-medium text-gray-600 dark:text-gray-300">Status:</span>
				<span class="font-semibold text-gray-900 dark:text-white">{gameStatus}</span>
			</div>
			
			<div class="flex justify-between items-center mb-3 py-2">
				<span class="font-medium text-gray-600 dark:text-gray-300">Current Turn:</span>
				<span class="px-3 py-1 rounded-md text-sm font-semibold {currentTurn === 'Black' ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600'}">
					{currentTurn}
				</span>
			</div>
		</div>
		
		<div class="flex gap-2">
			<button 
				class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors duration-200"
				on:click={toggleTurn}
			>
				Toggle Turn
			</button>
		</div>
	</div>
</div>

 