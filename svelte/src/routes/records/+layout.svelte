<script lang="ts">
	import SideBar from '$lib/sideBar.svelte';
	import { DeepSet } from '$lib/deepSet';
	const links = new DeepSet([
		{ Match: ['Individual', 'Team', 'Match', 'Day'] },
		//{ Cup: ['Individual', 'Team', 'Cup'] },
		{Overall:['Leaderboards']},
		//{ Rankings: ['Coefficient', 'Elo'] }
	]);
	const path='/records/';
</script>
<SideBar {links} {path} nested={true}>
	<slot />
</SideBar>