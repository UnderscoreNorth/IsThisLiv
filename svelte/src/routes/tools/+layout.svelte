<script lang="ts">
	import { browser } from '$app/environment';
	import { User } from '$lib/user';
	import { DeepSet } from '$lib/deepSet';
	import SideBar from '$lib/sideBar.svelte';

	let links = new DeepSet([
		['cache', 'Cache'],
		['upload', 'Upload Edit File'],
		['unlinked_players', 'Unlinked Players'],
		['unlinked_stadiums', 'Unlinked Stadiums'],
		['groupstage', 'Groupstage'],
		['maintenance', 'Maintenance']
	]);
	const path = '/tools/';
	if (browser && $User.access < 1) {
		window.location.replace('/');
	}
	if ($User.access == 3) {
		links.add(['users', 'Users']);
		links.add(['ff_teams', 'FF Teams']);
		links.add(['icons', 'Icons']);
	} else {
		links.delete(['users', 'Users']);
		links.delete(['ff_teams', 'FF Teams']);
	}
</script>

<svelte:head>
	<title>Tools - IsThisLiv</title>
</svelte:head>
<SideBar {links} {path}>
	<slot />
</SideBar>
