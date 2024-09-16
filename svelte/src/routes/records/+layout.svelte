<script lang="ts">
	import SideBar from '$lib/sideBar.svelte';
	import { DeepSet } from '$lib/deepSet';
	import { sidebarStore } from '$lib/sideBarStore';
	const links = new DeepSet([
		{ Match: ['Individual', 'Team', 'Match', 'Day'] },
		{ Cup: ['Individual', 'Team', 'Cup'] },
		{Overall:['Streaks','Leaderboards']},
		//{ Rankings: ['Coefficient', 'Elo'] }
		{Misc:['Repeat Groups',
		'Closed Groups',
		'Team Matchup',
		'Most Dangerous Lead',
		'90+ Goals',
		'Rematches',
		'Possession is a Negative Stat',
		'Stadiums',
		'Together Forever',
		'Yoyos',
		'Round Tour',
		'Shot Conversion',
		'Shit Medals',
		'Milestone Events',
		'Milestone Matches',
		'Condition Differences',
		'-',
		'Group Stage Results',
		'Group Stage Results by Team',
		'-',
		'Elite Streaks',
		'Elite Droughts',
		'-',
		'Blessed Players',
		'Cursed Players',
		'-',
		'Bench Warmers',
		'Always Subbed On',
		'Sub on MOTM',
		'Benched Medals',
		'Subbing GKs',
		'Players by Cup Debut']}
	]);
	const path='/records/';
	$sidebarStore = '';
</script>
<SideBar {links} {path} nested={true}>
	<slot />
</SideBar>