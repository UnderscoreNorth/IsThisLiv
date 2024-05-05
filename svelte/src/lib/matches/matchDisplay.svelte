<script lang='ts'>
	export let editMatch, match;
	//@ts-ignore
	import MdEdit from 'svelte-icons/md/MdEdit.svelte';
	import moment from 'moment'
	import type {Moment} from 'moment'
	import { User,LocalTime } from '$lib/user';
	import TeamIcon from '$lib/teamIcon.svelte';
	import TeamLink from '$lib/teamLink.svelte';
	let datetime = moment.utc(match.utcTime);
	function formatDate(m:Moment){
		return m.format('D/MM/YYYY')
	}
	function formatTime(m:Moment){
		return m.format('HH:mm:ss')
	}
</script>

<leftInfo>{$LocalTime ? formatDate(datetime.clone().local()) : formatDate(datetime)}<br />{$LocalTime ? formatTime(datetime.clone().local()) : formatTime(datetime)}</leftInfo>
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
