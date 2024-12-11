import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import pkg from 'pg';
import { env } from '$env/dynamic/private';
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

async function getSessionId(client: pkg.PoolClient, userId: string): Promise<string | null> {
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

	return preferredSession.id;
}

export const POST: RequestHandler = async (event: RequestEvent) => {
	const user_id = await authenticate(event);
	if (!user_id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	const name_id: string | undefined = event.params.id;

	if (!name_id || !user_id) {
		return json({ error: 'Missing name_id or user_id' }, { status: 400 });
	}

	try {
		const client = await pool.connect();
		const query = `
            INSERT INTO card_interactions (name_id, user_id, action, session_id)
            VALUES ($1, $2, 'liked', $3)
            RETURNING *;
        `;
		const session_id = await getSessionId(client, user_id);
		if (session_id === null) {
			return json({ error: `No active session could be found!` }, { status: 400 });
		}
		const values = [name_id, user_id, session_id];
		const result = await client.query(query, values);
		client.release();

		if (result.rowCount === 0) {
			return json({ error: `Names with the id ${name_id} not found` }, { status: 404 });
		}

		return new Response(null, { status: 204 });
	} catch (error) {
		console.error(error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
