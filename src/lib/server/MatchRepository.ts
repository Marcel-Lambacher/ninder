import type { PrismaClient } from '@prisma/client';

export type MatchPair = { id: number; superMatch: boolean };

export async function getCardIdsOfMatches(
	prisma: PrismaClient,
	userId: string,
	partnerId: string
): Promise<MatchPair[]> {
	const interactedCards = await prisma.card_interactions.groupBy({
		where: {
			OR: [
				{ user_id: userId, action: 'liked' },
				{ user_id: partnerId, action: 'liked' }
			]
		},
		by: ['name_id'],
		_count: { name_id: true },
		having: { name_id: { _count: { equals: 2 } } }
	});

	return interactedCards.map((card) => ({ id: card.name_id || -1, superMatch: false }));
}

export async function getSuperLikeMatches(
	prisma: PrismaClient,
	userId: string,
	partnerId: string
): Promise<MatchPair[]> {
	const interactedCards = await prisma.card_interactions.groupBy({
		where: {
			OR: [
				{ user_id: userId, action: 'superliked' },
				{ user_id: partnerId, action: 'superliked' }
			]
		},
		by: ['name_id'],
		_count: { name_id: true },
		having: { name_id: { _count: { gte: 1 } } }
	});

	return interactedCards.map((card) => ({ id: card.name_id || -1, superMatch: true }));
}