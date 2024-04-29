<script>
	import TeamIcon from "$lib/teamIcon.svelte";

    export let player;
    export let showPt = false;
    export let classes;
    export let onClick;
</script>
<tr on:click={()=>{onClick()}} class={classes} >
    <td class='board'><TeamIcon team={player.team}/> /{player.team}/</td>
    <td>{player.regPos}</td>
    <td>{player.medal}</td>
    <td>{player.name}</td> 
    {#if showPt}<td></td>{/if}
</tr>
<style>
    .board{white-space: nowrap;}
    td{text-align: left;overflow-x: hidden;text-overflow: ellipsis;}    
</style>