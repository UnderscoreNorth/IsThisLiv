<script lang='ts'>
	export let editMatch, match;
	//@ts-ignore
	import MdEdit from 'svelte-icons/md/MdEdit.svelte';
	import { User} from '$lib/user';
	import TeamIcon from '$lib/teamIcon.svelte';
	import TeamLink from '$lib/teamLink.svelte';
	import Datetime from '$lib/datetime.svelte';
	import EventIcon from '$lib/eventIcon.svelte';
	import PenaltyIcon from '$lib/penaltyIcon.svelte';
	console.log(match);
</script>

<leftInfo><Datetime date={match.utcTime}/></leftInfo>
<homeInfo><TeamLink team={match.home}/><TeamIcon team={match.home}/></homeInfo>
<scoreInfo>
	{#if match.official && !match.valid}	
	<i>
		{match.homeg}–{match.awayg} {match.endPeriod >= 1 ? '(a.e.t.)' : ''}<br>
		<small>Voided</small>
	</i>
	{:else}
	{match.homeg}–{match.awayg} {match.endPeriod >= 2 ? '(a.e.t.)' : ''}
	{/if}
</scoreInfo>
<awayInfo><TeamIcon team={match.away}/><TeamLink team={match.away}/><br>
</awayInfo>
<rightInfo>
	{#if $User.user}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<icon on:click={() => editMatch(match.id)}><MdEdit /></icon>
	{/if}
	{match.stadium}
	<br />Attendance: {match.attendance <= 0 ? 'Unknown' : match.attendance}
</rightInfo>
<small id='homeEvents' style:grid-column={'span 2'}>
	<table style:margin-left='auto'>
	{#each match.homeE as e}
	<tr>	
		<td><i>{#if e.secondary !== undefined}<a href='/players/{e.secondary.p.linkID}-{e.secondary.p.name}'>{e.secondary.p.name}</a> <EventIcon eventType={e.secondary.e.eventType}/>{/if}</i></td>		
		<td><a href='/players/{e.primary.p.linkID}-{e.primary.p.name}'>{e.primary.p.name}</a></td>
		<td>{e.primary.e.regTime}{e.primary.e.injTime >= 0 ? '+' + e.primary.e.injTime + "'" : "'"} <EventIcon eventType={e.primary.e.eventType}/></td>
	</tr>
	{/each}
	</table>
</small>
<small id='awayEvents' style:grid-column={'4 / span 2'} >
	<table style:margin-right='auto'>
	{#each match.awayE as e}
	<tr>	
		<td><EventIcon eventType={e.primary.e.eventType}/> {e.primary.e.regTime}{e.primary.e.injTime >= 0 ? '+' + e.primary.e.injTime + "'" : "'"}</td>		
		<td><a href='/players/{e.primary.p.linkID}-{e.primary.p.name}'>{e.primary.p.name}</a></td>
		<td><i>{#if e.secondary !== undefined}<EventIcon eventType={e.secondary.e.eventType}/> <a href='/players/{e.secondary.p.linkID}-{e.secondary.p.name}'>{e.secondary.p.name}</a>{/if}</i></td>		
	</tr>
	{/each}
	</table>
</small>
{#if match.penalties[0].length}
	<scoreInfo style:grid-column={'3'}>
		Penalties
	</scoreInfo>
	<homeInfo style:grid-column={'span 2'} style:grid-row={'4'}>
		<small>
			{#each match.penalties[0] as p}
			<a href='/players/{p.player.linkID}-{p.player.name}'>{p.player.name}</a> <PenaltyIcon goal={p.goal}/><br>
			{/each}
		</small>
	</homeInfo>
	<scoreInfo style:grid-row={'4'}>
		{match.penalties[0].filter(x=>x.goal).length}-{match.penalties[1].filter(x=>x.goal).length}
	</scoreInfo>
	<awayInfo  style:grid-row={'4'}>
		<small>
		{#each match.penalties[1] as p}
		<PenaltyIcon goal={p.goal}/> <a href='/players/{p.player.linkID}-{p.player.name}'>{p.player.name}</a><br>
		{/each}
	</small>
</awayInfo>
{/if}
<style>
	leftInfo,
	homeInfo {
		text-align: right;
	}
	rightInfo,
	awayInfo, #awayEvents table td {
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
