import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import pkg from 'pg';
import { env } from '$env/dynamic/private';
import type { Match } from '$lib/types';
import { authenticate } from '$lib/server/authenticate';

const { Pool } = pkg;

const pool = new Pool({
	user: env.DB_USER,
	host: env.DB_HOST,
	database: env.DB_NAME,
	password: env.DB_PASSWORD,
	port: parseInt(env.DB_PORT),
	ssl: {
		rejectUnauthorized: false
	}
});

type MatchPair = { id: number; superMatch: boolean };

export const GET: RequestHandler = async (event: RequestEvent) => {
	const userId = await authenticate(event);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const client = await pool.connect();

		try {
			const partnerUserId = await getPartnerUserId(userId, client);
			const cardIds = await getCardIdOfMatches(userId, partnerUserId, client);
			const names = await getNames(cardIds, client);

			return json(names);
		} finally {
			client.release();
		}
	} catch (error) {
		return json({ error: 'Failed to fetch categories' }, { status: 500 });
	}
};

async function getNames(nameIds: MatchPair[], client: pkg.PoolClient): Promise<Match[]> {
	const query = `
		SELECT name.id, name.name, name.meaning
		FROM names name
		WHERE name.id = ANY($1)
	`;

	const res = await client.query(query, [nameIds.map((name) => name.id)]);
	return res.rows.map((row) => {
		const matchPair = nameIds.find((name) => name.id === row.id);
		return {
			name: row.name,
			meaning: row.meaning,
			cardId: row.id,
			superMatch: matchPair ? matchPair.superMatch : false
		};
	});
}

async function getPartnerUserId(userId: string, client: pkg.PoolClient): Promise<number | null> {
	const result = await client.query(
		`SELECT * FROM sessions WHERE partnerUserId = $1 OR initiatorUserId = $1`,
		[userId]
	);

	if (result.rows.length === 0) {
		return null;
	}

	const sessions = result.rows;
	let preferredSession = sessions.find((session) => session.partneruserid === userId);

	if (!preferredSession) {
		preferredSession = sessions.find((session) => session.initiatoruserid === userId);
	}

	if (!preferredSession) {
		return null;
	}

	return preferredSession.partneruserid === userId
		? preferredSession.initiatoruserid
		: preferredSession.partneruserid;
}

async function getCardIdOfMatches(
	userId: string,
	partnerId: string,
	client: pkg.PoolClient
): Promise<MatchPair[]> {
	const query = `
        SELECT ci1.name_id, ci1.action AS user1_action, ci2.action AS user2_action
        FROM card_interactions ci1
        JOIN card_interactions ci2 ON ci1.name_id = ci2.name_id
        WHERE ci1.user_id = $1 AND ci2.user_id =$2 AND ci1.user_id != ci2.user_id
	`;
	const res = await client.query(query, [userId, partnerId]);
	return res.rows.map((row) => ({
		id: row.name_id,
		superMatch: row.user1_action === 'superliked' || row.user2_action === 'superliked'
	}));
}
