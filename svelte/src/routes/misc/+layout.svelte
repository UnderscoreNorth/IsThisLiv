<script lang="ts">
	import SideBar from '$lib/sideBar.svelte';
	import { DeepSet } from '$lib/deepSet';
	const links = new DeepSet([
		['repeat_groups', 'Repeat Groups'],
		['most_dangerous_lead', 'Most Dangerous Lead'],
		['rematches', 'Rematches'],
		['bench_warmers', 'Bench Warmers'],
		['last_elite_knockout', 'Last Elite Knockout'],
		['round_tour', 'Round Tour'],
		['elite_streaks', 'Elite Streaks'],
		['subbing_the_keeper', 'Subbing the Keeper'],
		['sub_on_motm', 'Sub On Man of the Match'],
		['shit_medals', '4.5 Medal Performances'],
		['shot_conversion', '100% Shot Conversion'],
		['cursed_players', 'Cursed Players'],
		['blessed_players', 'Blessed Players'],
		['subbed_players', 'Always Subbed Players'],
		['together_forever', 'Together Forever'],
		['condition_difference', 'Condition Difference'],
		['cup_rematch', 'Cup Rematch'],
		['benched_medal', 'Benched Medal'],
		['closed_groups', 'Closed Groups'],
		['milestone_matches', 'Milestone Matches'],
		['milestone_events', 'Milestone Events'],
		['milestone_events_you_dont_get_to_bring_friends', 'Milestone Events (Without friendlies)'],
		['yoyos', 'Yoyos'],
		['group_stage_results', 'Group Stage Results'],
		['group_stage_results_by_team', 'Group Stage Results by Team'],
		['team_stats', 'Team Stats'],
		['possession', 'Posession is a Negative Stat'],
		['team_matchup', 'Team Matchup'],
		['cup_veterans', 'Cup Veterans'],
		['roster_stats', 'Roster Stats']
	]);
	const path = '/misc/';
</script>
<SideBar {links} {path}>
	<slot />
</SideBar>
