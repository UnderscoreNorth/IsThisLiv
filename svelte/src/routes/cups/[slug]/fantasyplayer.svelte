<script>
	import TeamIcon from "$lib/teamIcon.svelte";
    export let player
    const capType = ['','(V)','(C)']
</script>
<td style:width='3rem'><TeamIcon team={player.team} /></td>
<td style:width='2.5rem' style:text-align='center' class={player.medal}>{player.pos}</td>
<td style:text-align='left'>
    {@html player.player}
    {capType[player.cap]}
</td>