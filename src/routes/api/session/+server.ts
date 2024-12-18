import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import type { Session } from '$lib/types';
import { authenticate } from '$lib/server/authenticate';
import {
	createSession,
	deleteSession,
	getSessionId,
	getSessions,
	joinSession
} from '$lib/server/SessionRepository';
import { deleteAllCardInteractions } from '$lib/server/CardInteractionRepository';
import { deleteHistory } from '$lib/server/CategoryRepository';

function generatePairingCode(): string {
	return Math.floor(1000 + Math.random() * 9000).toString();
}

export const GET: RequestHandler = async (event: RequestEvent) => {
	const userId = await authenticate(event);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!userId) {
		return json({ error: 'user_id is required' }, { status: 400 });
	}

	try {
		const sessions = await getSessions(userId);

		if (sessions.length === 0) {
			return json({ error: 'No session found' }, { status: 404 });
		}

		let preferredSession = sessions.find((session) => session.partnerUserId === userId);

		if (!preferredSession) {
			preferredSession = sessions.find((session) => session.initiatorUserId === userId);
		}

		if (!preferredSession) {
			return json({ error: 'No session found' }, { status: 404 });
		}

		return json(preferredSession);
	} catch (error) {
		return json({ error: 'Failed to fetch session' }, { status: 500 });
	}
};

export const POST: RequestHandler = async (event: RequestEvent) => {
	const userId = await authenticate(event);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const newSession: Session = await event.request.json();
		if (!newSession.initiatorUserId && !newSession.partnerUserId) {
			return json(
				{ error: 'when creating a session, initiator_user_id is required!' },
				{ status: 400 }
			);
		}

		if (newSession.initiatorUserId && newSession.partnerUserId) {
			return json(
				{ error: 'when joining a session, initiator_user_id cannot be set!' },
				{ status: 400 }
			);
		}

		if (newSession.partnerUserId && !newSession.pairingCode) {
			return json({ error: 'when joining a session, pairing code is required!' }, { status: 400 });
		}

		let isNewSession = !!newSession.initiatorUserId;

		if (isNewSession) {
			const pairingCode = generatePairingCode();
			const session = await createSession(newSession.initiatorUserId, pairingCode);

			return json(session, { status: 201 });
		} else {
			const session = await joinSession(newSession.partnerUserId || '', newSession.pairingCode);
			return json(session, { status: 200 });
		}
	} catch (error) {
		return json({ error: 'Failed to create session' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	const userId = await authenticate(event);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!userId) {
		return json({ error: 'user_id is required' }, { status: 400 });
	}

	try {
		const sessionId = await getSessionId(userId);
		await deleteAllCardInteractions(sessionId || -1);
		await deleteSession(sessionId || -1);
		await deleteHistory(userId);

		return json({ message: 'Session deleted successfully' });
	} catch (error) {
		return json({ error: 'Failed to delete session' }, { status: 500 });
	}
};
