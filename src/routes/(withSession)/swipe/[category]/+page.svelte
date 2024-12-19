<script lang="ts">
	import type { Card } from '$lib/types';
	import { page } from '$app/stores';
	import CardActionBar from './CardActionBar.svelte';
	import SwipeableCardStack from '$lib/components/SwipeableCardStack.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import SwipeFeedback from './SwipeFeedback.svelte';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { getCards, swipeCard } from '$lib/client/CardClient';
	import Match from './Match.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import GenericTitleHeader from '$lib/components/GenericTitleHeader.svelte';
	import { getSexState } from '$lib/components/SexStore.svelte';
	import SexToggle from '$lib/components/SexToggle.svelte';

	let swipeableCardStack: SwipeableCardStack;
	let swipeFeedbackState: 'left' | 'right' | 'none' | 'top' = $state('none');
	let backgroundColor = $state('bg-slate-100');
	let take = 50;
	let country = $page.params.category;

	let matchDialog: Match | null = $state(null);

	const cardsQuery = createQuery<Card[], Error>({
		queryKey: ['cards', country, take],
		queryFn: () => getCards(country, take, getSexState())
	});

	let isMutating = $state(false);
	const client = useQueryClient();
	const swipeMutation = createMutation({
		mutationFn: swipeCard,
		onMutate: async (swipeAction: {
			card: Card;
			swipeAction: 'like' | 'dislike' | 'superlike';
		}) => {
			isMutating = true;
			await client.cancelQueries({ queryKey: ['cards', country, take] });
			let previousCards = client.getQueryData<Card[]>(['cards', country, take]);

			if (previousCards) {
				let optimisticCards = previousCards.filter((c) => c.id != swipeAction.card.id);
				client.setQueryData<Card[]>(['cards', country, take], () => [...optimisticCards]);
			}

			return { previousCards };
		},
		onSuccess: async () => {
			let remainingCards = client.getQueryData<Card[]>(['cards', country, take]);
			if (remainingCards && take - remainingCards.length >= 10) {
				await client.invalidateQueries({ queryKey: ['cards', country, take] });
			}
			isMutating = false;
		}
	});

	async function onSuperLike(card: Card) {
		$swipeMutation.mutate({ card: card, swipeAction: 'superlike' });
		if (card.partnerInteraction?.swipe == 'superliked') {
			onMatch(card);
		}
	}
	async function onLike(card: Card) {
		$swipeMutation.mutate({ card: card, swipeAction: 'like' });
		if (card.partnerInteraction?.swipe == 'liked') {
			onMatch(card);
		}
	}

	async function onDislike(card: Card) {
		$swipeMutation.mutate({ card: card, swipeAction: 'dislike' });
		if (card.partnerInteraction?.swipe == 'superliked') {
			onMatch(card);
		}
	}

	function onSwipeFeedback(feedbackType: 'left' | 'right' | 'none' | 'top') {
		swipeFeedbackState = feedbackType;

		if (feedbackType == 'right' || feedbackType == 'top') {
			backgroundColor = 'bg-emerald-400';
		} else if (feedbackType == 'left') {
			backgroundColor = 'bg-red-400';
		} else {
			backgroundColor = 'bg-slate-100';
		}
	}

	function onSwipe(swipe: 'left' | 'right' | 'top') {
		if (!$cardsQuery.data) {
			return;
		}

		if ($cardsQuery.data.length === 0) {
			return;
		}

		if (swipe === 'left') {
			onDislike($cardsQuery.data[$cardsQuery.data.length - 1]);
		} else if (swipe === 'right') {
			onLike($cardsQuery.data[$cardsQuery.data.length - 1]);
		} else if (swipe === 'top') {
			onSuperLike($cardsQuery.data[$cardsQuery.data.length - 1]);
		}
	}

	async function onMatch(card: Card) {
		matchDialog?.showMatch(card);
		await client.refetchQueries({ queryKey: ['matches'] });
		await client.refetchQueries({ queryKey: ['categories'] });
	}

	async function onSexChange(sex: 'male' | 'female' | 'all') {
		client.setQueryData<Card[]>(['cards', country, take], () => []);
		await client.invalidateQueries({ queryKey: ['cards', country, take] });
	}
</script>

<GenericTitleHeader title={m.swipe_header()} />
<div class=" pl-4 pr-4">
	<SexToggle {onSexChange} />
</div>
<div class="relative flex h-full w-full flex-col items-center pb-4 pl-4 pr-4">
	<div class="mb-4"></div>
	<SwipeFeedback {swipeFeedbackState} />

	{#if $cardsQuery.isLoading}
		<LoadingSpinner />
	{/if}

	<SwipeableCardStack
		bind:this={swipeableCardStack}
		cards={$cardsQuery.data}
		{onSwipeFeedback}
		{onSwipe}
	/>

	<Match bind:this={matchDialog} />
</div>

<style>
	.bckground-color-transition {
		-webkit-transition: background-color 200ms linear;
		-ms-transition: background-color 200ms linear;
		transition: background-color 200ms linear;
	}
</style>
