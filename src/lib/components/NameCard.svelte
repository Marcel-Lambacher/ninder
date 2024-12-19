<script lang="ts">
	import { randombackgroundcolor } from '$lib/actions/randomBackgroundColor';
	import type { Card } from '$lib/types';
	const { card, shadow }: { card: Card | undefined; shadow: boolean } = $props();
	import { fittedtext } from '$lib/actions/fittedtext';
	import * as m from '$lib/paraglide/messages.js';
</script>

{#if card}
	<div
		use:randombackgroundcolor={card.id}
		class="grid h-full w-full grid-rows-3 rounded-lg"
		class:shadow-xl={shadow}
	>
		<div class="row-span-2 w-full content-center overflow-hidden p-2">
			<h1 use:fittedtext class="w-full text-8xl font-bold text-white">{card.name}</h1>
			<div class="mb-5 mt-5 flex flex-wrap justify-center text-4xl">
				{#each card.countries as country}
					<span class="fi mb-2 ml-1 mr-1 fi-{country.toLowerCase()}"></span>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<div
		class="flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-400 bg-slate-300 p-5 shadow-xl"
	>
		<h1 class="text-center text-6xl font-bold text-slate-50">{m.namecard_thats_it()}</h1>
		<i class="fa-solid fa-flag-checkered mt-10 text-9xl text-slate-50"></i>
	</div>
{/if}
