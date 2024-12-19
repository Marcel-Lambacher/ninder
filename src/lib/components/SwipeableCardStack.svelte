<script lang="ts">
	import type { Card } from '$lib/types';
	import NameCard from './NameCard.svelte';
	import { pan, type PanEvent } from '../actions/pan';
	import CardActionBar from '../../routes/(withSession)/swipe/[category]/CardActionBar.svelte';

	type Props = {
		onSwipeFeedback: (feedbackType: 'left' | 'right' | 'none' | 'top') => void;
		onSwipe: (swipe: 'left' | 'right' | 'top') => void;
		cards: Card[] | undefined;
	};

	const { onSwipeFeedback, onSwipe, cards }: Props = $props();

	let translateX = $state(0);
	let rotation = $derived(translateX / 10);
	let transitionAnimation = $state(false);
	let cardsLength = $derived(cards?.length || 0);

	function onpan(event: CustomEvent<PanEvent>) {
		transitionAnimation = false;
		translateX = event.detail.deltaX;

		if (event.detail.deltaX > 100) {
			onSwipeFeedback('right');
		} else if (event.detail.deltaX < -100) {
			onSwipeFeedback('left');
		} else {
			onSwipeFeedback('none');
		}
	}

	function onpanend(event: CustomEvent<PanEvent>) {
		if (event.detail.deltaX > 100) {
			swipe('right');
		} else if (event.detail.deltaX < -100) {
			swipe('left');
		} else {
			transitionAnimation = true;
			resetTranslation();
			setTimeout(() => {
				resetAnimation();
			}, 500);
		}
	}

	export function swipe(direction: 'right' | 'left' | 'top') {
		transitionAnimation = true;
		onSwipeFeedback(direction);

		if (direction == 'right' || direction == 'top') {
			translateRight();
		} else {
			translateLeft();
		}

		setTimeout(() => {
			resetTranslation();
			resetAnimation();
			onSwipeFeedback('none');
			onSwipe(direction);
		}, 500);
	}

	function resetTranslation() {
		translateX = 0;
	}

	function resetAnimation() {
		transitionAnimation = false;
	}

	function translateRight() {
		translateX = window.innerWidth * 1.5;
	}

	function translateLeft() {
		translateX = -(window.innerWidth * 1.5);
	}

	function isTopMostCard(index: number) {
		return index === cardsLength - 1;
	}

	let derivedTransformStyle = $derived.by(() => {
		return `transform: translateX(${translateX}px) rotate(${rotation}deg);`;
	});
</script>

<div class="relative h-full w-full">
	<div class="absolute h-full w-full">
		<NameCard card={undefined} shadow={true} />
	</div>
	{#each cards || [] as card, index}
		{#key card.id}
			<div
				use:pan
				{onpan}
				{onpanend}
				class="absolute h-full w-full"
				class:duration-500={isTopMostCard(index) && transitionAnimation}
				class:transition-all={isTopMostCard(index) && transitionAnimation}
				style={isTopMostCard(index) ? derivedTransformStyle : ''}
			>
				<NameCard {card} shadow={isTopMostCard(index)} />
			</div>
		{/key}
	{/each}
	<div class="absolute flex h-full w-full items-end pb-5">
		<CardActionBar
			onDislikeButton={() => swipe('left')}
			onLikeButton={() => swipe('right')}
			onSuperLikeButton={() => swipe('top')}
		/>
	</div>
</div>
