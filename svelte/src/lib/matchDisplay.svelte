<script>
	export let editMatch, match;
	import { teamLink } from '$lib/helper';
	import MdEdit from 'svelte-icons/md/MdEdit.svelte';
	import { User } from '$lib/user';
</script>

<leftInfo>{match.date}<br />{match.time}</leftInfo>
<homeInfo>{@html teamLink(match.home)}</homeInfo>
<scoreInfo>{match.homeg}–{match.awayg}</scoreInfo>
<awayInfo>{@html teamLink(match.away)}</awayInfo>
<rightInfo>
	{#if $User.username}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<icon on:click={() => editMatch(match.id)}><MdEdit /></icon>
	{/if}
	{match.stadium}
	<br />Attendance: {match.attendance <= 0 ? 'Unknown' : match.attendance}
</rightInfo>

<style>
	leftInfo,
	homeInfo {
		text-align: right;
	}
	rightInfo,
	awayInfo {
		text-align: left;
	}
	scoreInfo {
		text-align: center;
		font-weight: bold;
	}
	icon {
		height: 1rem;
		width: 1rem;
		float: right;
		display: block;
		cursor: pointer;
		border-radius: 0.25rem;
		padding: 0.25rem;
	}
	icon:hover {
		background: #2e51a2;
	}
</style>
