<script>
	export let editMatch, match;
	//@ts-ignore
	import MdEdit from 'svelte-icons/md/MdEdit.svelte';
	import { User } from '$lib/user';
	import TeamIcon from '$lib/teamIcon.svelte';
	import TeamLink from '$lib/teamLink.svelte';
</script>

<leftInfo>{match.date}<br />{match.time}</leftInfo>
<homeInfo><TeamLink team={match.home}/><TeamIcon team={match.home}/></homeInfo>
<scoreInfo>
	{#if match.official && !match.valid}	
	<i>
		{match.homeg}–{match.awayg}<br>
		<small>Voided</small>
	</i>
	{:else}
	{match.homeg}–{match.awayg}
	{/if}
</scoreInfo>
<awayInfo><TeamIcon team={match.away}/><TeamLink team={match.away}/></awayInfo>
<rightInfo>
	{#if $User.user}
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
