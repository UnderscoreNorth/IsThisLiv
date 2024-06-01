<script lang="ts">
	import SideBar from '$lib/sideBar.svelte';
	import { DeepSet } from '$lib/deepSet';
	const links = new DeepSet([
		{ Match: ['Individual', 'Team', 'Match', 'Day'] },
		{ Cup: ['Individual', 'Team', 'Cup'] },
		{Overall:['Streaks','Leaderboards']},
		//{ Rankings: ['Coefficient', 'Elo'] }
		{Misc:['Repeat Groups','Most Dangerous Lead']}
	]);
	const path='/records/';
</script>
<SideBar {links} {path} nested={true}>
	<slot />
</SideBar>