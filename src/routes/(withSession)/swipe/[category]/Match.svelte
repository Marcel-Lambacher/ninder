<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { Card } from '$lib/types';
	import NameCard from '../../../../lib/components/NameCard.svelte';
	import AnimatedStars from '$lib/components/AnimatedStars.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let card: Card | null = $state(null);
	let open = $state(false);

	export function showMatch(newMatch: Card) {
		card = newMatch;
		open = true;
	}

	export function close() {
		card = null;
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="border-none bg-transparent shadow-none">
		<AnimatedStars />

		<Dialog.Header class="z-10">
			<Dialog.Title
				><h1
					class="justify-self-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent"
				>
					{#if card?.partnerInteraction?.swipe == 'superliked'}
						{m.match_super_match()}
					{:else}
						{m.match_its_match()}
					{/if}
				</h1></Dialog.Title
			>
		</Dialog.Header>

		<div class="z-10 mb-4 h-[50vh]">
			<NameCard {card} shadow={true} />
		</div>

		<Dialog.Footer class="z-10">
			<Button onclick={close} class="text-xl font-bold" type="submit">{m.swipe_continue()}</Button>
			<Button
				href="/matches"
				class="mb-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-xl font-bold"
				type="submit">{m.match_goto_match()}</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
