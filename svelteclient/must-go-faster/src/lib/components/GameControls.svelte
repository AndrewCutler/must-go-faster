<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { createSocket, socket } from '../../store/must-go-faster.store';

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

	function connect() {
		if ($socket && $socket.OPEN) {
			console.error('attempted to open already opened ws');
			return;
		}

		socket.set(createSocket('', 'computer'));
		// dispatch('connectionToggle', { connected: isConnected });
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
	<div
		class="rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="mb-4 border-b border-gray-200 pb-2 dark:border-gray-600">
			<h3 class="text-lg font-semibold text-gray-800 dark:text-white">Game Controls</h3>
		</div>

		<div class="flex flex-col gap-4">
			<!-- Player Type Dropdown -->
			<div class="flex flex-col gap-2">
				<label class="text-sm font-medium text-gray-700 dark:text-gray-300">Player Type</label>
				<div class="relative">
					<button
						class="flex w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-base transition-all duration-200 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
						onclick={toggleDropdown}
						type="button"
					>
						<span class="font-medium text-gray-900 dark:text-white">{playerType}</span>
						<span
							class="text-gray-500 transition-transform duration-200 dark:text-gray-400 {isDropdownOpen
								? 'rotate-180'
								: ''}"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								></path>
							</svg>
						</span>
					</button>

					{#if isDropdownOpen}
						<div
							class="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
						>
							<div class="py-1">
								<button
									class="w-full px-4 py-3 text-left text-gray-900 transition-colors duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600 {playerType ===
									'Computer'
										? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
										: ''}"
									onclick={() => selectPlayerType('Computer')}
									type="button"
								>
									Computer
								</button>
								<button
									class="w-full px-4 py-3 text-left text-gray-900 transition-colors duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600 {playerType ===
									'Human'
										? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
										: ''}"
									onclick={() => selectPlayerType('Human')}
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
					class="w-full rounded-md px-4 py-3 text-base font-semibold transition-colors duration-200 {!isConnected
						? 'bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'
						: 'bg-red-600 text-white hover:bg-red-700'}"
					onclick={connect}
					type="button"
				>
					{isConnected ? 'Disconnect' : 'Find a game'}
				</button>
			</div>
		</div>
	</div>
</div>
