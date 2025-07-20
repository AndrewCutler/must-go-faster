<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let { playerType = 'Computer', isConnected = false } = $props();
	let isDropdownOpen = false;

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	function selectPlayerType(type: string) {
		playerType = type;
		isDropdownOpen = false;
		dispatch('playerTypeChange', { type });
	}

	function toggleConnection() {
		isConnected = !isConnected;
		dispatch('connectionToggle', { connected: isConnected });
	}

	function closeDropdown() {
		isDropdownOpen = false;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.relative')) {
			isDropdownOpen = false;
		}
	}

	// Add click outside listener
	$effect(() => {
		if (isDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="mb-4">
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
		<div class="mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
			<h3 class="text-lg font-semibold text-gray-800 dark:text-white">Game Controls</h3>
		</div>
		
		<div class="flex flex-col gap-4">
			<!-- Player Type Dropdown -->
			<div class="flex flex-col gap-2">
				<label class="font-medium text-gray-700 dark:text-gray-300 text-sm">Player Type</label>
				<div class="relative">
					<button 
						class="w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer text-base transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
						on:click={toggleDropdown}
						type="button"
					>
						<span class="font-medium text-gray-900 dark:text-white">{playerType}</span>
						<span class="text-gray-500 dark:text-gray-400 transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
							</svg>
						</span>
					</button>
					
					{#if isDropdownOpen}
						<div class="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
							<div class="py-1">
								<button 
									class="w-full px-4 py-3 text-left transition-colors duration-200 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 {playerType === 'Computer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold' : ''}"
									on:click={() => selectPlayerType('Computer')}
									type="button"
								>
									Computer
								</button>
								<button 
									class="w-full px-4 py-3 text-left transition-colors duration-200 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 {playerType === 'Human' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold' : ''}"
									on:click={() => selectPlayerType('Human')}
									type="button"
								>
									Human
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Connection Button -->
			<div class="flex flex-col gap-2">
				<button 
					class="w-full px-4 py-3 rounded-md font-semibold text-base transition-colors duration-200 {!isConnected ? 'bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-900 dark:hover:bg-gray-600' : 'bg-red-600 text-white hover:bg-red-700'}"
					on:click={toggleConnection}
					type="button"
				>
					{isConnected ? 'Disconnect' : 'Find a game'}
				</button>
			</div>
		</div>
	</div>
</div>

 