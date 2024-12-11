import admin from 'firebase-admin';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function authenticate(event: RequestEvent): Promise<string | null> {
	if (!admin.apps.length) {
		admin.initializeApp({
			credential: admin.credential.cert(
				JSON.parse(Buffer.from(env.FIREBASE_ADMIN_CREDENTIALS, 'base64').toString('utf-8'))
			)
		});
	}

	const authHeader = event.request.headers.get('Authorization');

	if (!authHeader) {
		return null;
	}

	try {
		const idToken = authHeader.split('Bearer ')[1];
		const decodedToken = await admin.auth().verifyIdToken(idToken);
		return decodedToken.uid;
	} catch {
		return null;
	}
}
