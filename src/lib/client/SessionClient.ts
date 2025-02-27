import { getUserStore } from '$lib/FirebaseStore.svelte';
import type { CreateSession, JoinSession, Session } from '$lib/types';

export const deleteSession = async (userId: string) => {
	const idToken = await getUserStore().user?.getIdToken();
	const response = await fetch(`/api/session`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${idToken}`
		}
	});

	if (response.status === 404) {
		return { error: 'No session found to delete' };
	}

	if (response.status === 500) {
		return { error: 'Failed to delete session' };
	}

	const data = await response.json();
	return data;
};

export const getSession = async (userId: string) => {
	const idToken = await getUserStore().user?.getIdToken();
	const response = await fetch(`/api/session`, { headers: { Authorization: `Bearer ${idToken}` } });
	const data = await response.json();
	if (response.status === 404) {
		return null;
	}

	return data as Session;
};

export const createSession = async (userId: string) => {
	const idToken = await getUserStore().user?.getIdToken();
	const session: CreateSession = {
		initiatorUserId: userId
	};
	const response = await fetch(`/api/session`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${idToken}`
		},
		body: JSON.stringify(session)
	});
	const data = await response.json();
	return data as Session;
};

export const joinSession = async (userId: string, pairingCode: string) => {
	const idToken = await getUserStore().user?.getIdToken();
	const session: JoinSession = {
		partnerUserId: userId,
		pairingCode: pairingCode
	};
	const response = await fetch(`/api/session`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${idToken}`
		},
		body: JSON.stringify(session)
	});

	if (response.status === 404) {
		return null;
	}

	const data = await response.json();
	return data as Session;
};
