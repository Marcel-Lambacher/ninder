import type { CategoryProgress } from '$lib/types';
import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import { authenticate } from '$lib/server/authenticate';
import { PrismaClient } from '@prisma/client';
import { getCategories } from '$lib/server/CategoryRepository';
import { getCardInteractions, type InteractedCards } from '$lib/server/CardInteractionRepository';

export const GET: RequestHandler = async (event: RequestEvent) => {
	const userId = await authenticate(event);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const prisma = new PrismaClient();
	try {
		const categories = await getCategories(prisma);
		const interactedCards = await getCardInteractions(prisma, userId);

		let categoryProgress: CategoryProgress[] = calculateCountryCategoryProgress(
			interactedCards,
			categories
		);
		categoryProgress = calculateMixedCategoryProgress(categoryProgress, interactedCards);
		categoryProgress = enhanceWithPartnerCategory(categoryProgress);

		return json(categoryProgress);
	} catch {
		return json({ error: 'Failed to fetch categories' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
};

function enhanceWithPartnerCategory(categoryProgress: CategoryProgress[]) {
	categoryProgress.unshift({
		name: 'Dein Partner',
		letterCode: '[DP]',
		totalCards: 0,
		swipedCards: 0,
		id: -1
	});

	return categoryProgress;
}

function calculateCountryCategoryProgress(
	interactedCards: InteractedCards[],
	categories: {
		name: string;
		id: number;
		letter_code: string | null;
		total_cards: number | null;
		visible: boolean | null;
	}[]
) {
	const categoryProgress: CategoryProgress[] = categories.map((category) => ({
		name: category.name,
		letterCode: category.letter_code ?? '',
		totalCards: category.total_cards ?? 0,
		swipedCards: calculateCardCountForCategory(interactedCards, category.id),
		id: category.id
	}));
	return categoryProgress;
}

function calculateMixedCategoryProgress(
	categoryProgress: CategoryProgress[],
	interactedCards: InteractedCards[]
) {
	const mixedCategoryId = 1;
	const mixedCategory = categoryProgress.find((category) => category.id === mixedCategoryId);
	if (mixedCategory) {
		mixedCategory.swipedCards = interactedCards.length;
	}

	return categoryProgress;
}

function calculateCardCountForCategory(interactedCards: InteractedCards[], categoryId: number) {
	const interactedCardsInCategory = interactedCards.filter((card) =>
		card.categories.includes(categoryId)
	);
	return interactedCardsInCategory.length;
}
