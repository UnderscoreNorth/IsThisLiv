<script lang="ts">
	import SideBar from '$lib/sideBar.svelte';
	import { DeepSet } from '$lib/deepSet';
	const links = new DeepSet([
		{ Match: ['Individual', 'Team', 'Match', 'Day'] },
		{ Cup: ['Individual', 'Team', 'Cup'] },
		{Overall:['Streaks','Leaderboards']},
		//{ Rankings: ['Coefficient', 'Elo'] }
		{Misc:['Repeat Groups','Team Matchup','Most Dangerous Lead','90+ Goals','Rematches','Possession is a Negative Stat','Group Stage Results','Group Stage Results by Team','Yoyos']}
	]);
	const path='/records/';
</script>
<SideBar {links} {path} nested={true}>
	<slot />
</SideBar>