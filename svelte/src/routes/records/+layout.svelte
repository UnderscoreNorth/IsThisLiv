<script lang="ts">
	import SideBar from '$lib/sideBar.svelte';
	import { DeepSet } from '$lib/deepSet';
	import { sidebarStore } from '$lib/sideBarStore';
	const links = new DeepSet([
		{ Match: ['Individual', 'Team', 'Match', 'Day'] },
		{ Cup: ['Individual', 'Team', 'Cup'] },
		{ Overall: ['Streaks', 'Leaderboards'] },
		//{ Rankings: ['Coefficient', 'Elo'] }
		{
			Misc: [
				'Most Dangerous Lead',
				'90+ Goals',
				'Possession is a Negative Stat',
				'Condition Differences',
				'Stadiums',
				'Round Tour',
				'Shot Conversion',
				'Shit Medals',
				'Milestone Events',
				'Milestone Matches',
				'-',
				'Team Matchup',
				'Rematches',
				'Together Forever',
				'Facing the Cup Winner',
				'-',
				'Group Stage Results',
				'Group Stage Results by Team',
				'Repeat Groups',
				'Closed Groups',
				'-',
				'Elite Streaks',
				'Elite Droughts',
				'Yoyos',
				'-',
				'Blessed Players',
				'Cursed Players',
				'-',
				'Bench Warmers',
				'Always Subbed On',
				'Sub on MOTM',
				'Nonmedal MOTM',
				'Benched Medals',
				'Subbing GKs',
				'Players by Cup Debut',
				'All Medals Scoring'
			]
		}
	]);
	const path = '/records/';
	$sidebarStore = '';
</script>

<SideBar {links} {path} nested={true}>
	<slot />
</SideBar>
