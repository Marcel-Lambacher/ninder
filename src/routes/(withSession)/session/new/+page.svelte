<script lang="ts">
	import GenericTitleHeader from '$lib/components/GenericTitleHeader.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import JoinSession from './JoinSession.svelte';
	import CreateSession from './CreateSession.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import * as m from '$lib/paraglide/messages.js';

	const client = useQueryClient();

	let tabValue = $state('create');
	let isRefetching = $state(false);

	async function onjoined() {
		isRefetching = true;
		await client.invalidateQueries({ queryKey: ['session'] });
		await client.refetchQueries({ queryKey: ['session'] });
		setTimeout(async () => {
			await goto('/'), (isRefetching = false);
		}, 1000);
	}

	function handleTabChange(value: string) {
		const query = new URLSearchParams(window.location.search);
		query.set('action', value);
		history.replaceState(null, '', `${window.location.pathname}?${query.toString()}`);
	}

	onMount(() => {
		const query = new URLSearchParams(window.location.search);
		const action = query.get('action');
		if (action === 'create' || action === 'join') {
			tabValue = action;
		}
	});
</script>

<GenericTitleHeader title={m.session_new_title()} />

<div class="flex h-full flex-col items-center justify-center">
	<Tabs.Root value={tabValue} class="w-4/5" onValueChange={(event) => handleTabChange(event)}>
		<Tabs.List class="grid grid-cols-2 bg-slate-200">
			<Tabs.Trigger value="create">{m.session_new_create()}</Tabs.Trigger>
			<Tabs.Trigger value="join">{m.session_new_join()}</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="create" class="">
			<CreateSession {onjoined} />
		</Tabs.Content>
		<Tabs.Content value="join" class="">
			<JoinSession {onjoined} />
		</Tabs.Content>
	</Tabs.Root>
</div>
