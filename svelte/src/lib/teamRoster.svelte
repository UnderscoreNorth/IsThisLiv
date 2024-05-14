<script>
	import Pos from "./pos.svelte";
    export let roster;
</script>
<table>
    <tr>
        <th>#</th>
        <th>Pos</th>
        <th>Starting</th>
    </tr>
{#each roster.filter(x=>x.player.starting) as p}
    <tr class={p.player.medal}>
        <td>{p.player.shirtNumber}</td>
        <td><Pos pos={p.player.regPos}/></td>
        <td>{p.player.name} {p.player.captain ? '(C)' : ''}</td>
    </tr>
{/each}
</table>
<table>
    <tr>
        <th>#</th>
        <th>Pos</th>
        <th>Bench</th>
    </tr>
{#each roster.filter(x=>!x.player.starting) as p}
    <tr  class={p.player.medal}>
        <td>{p.player.shirtNumber}</td>
        <td><Pos pos={p.player.regPos}/></td>
        <td>{p.player.name} {p.player.captain ? '(C)' : ''}</td>
    </tr>
{/each}
</table>
<style>
     td{
        text-align: left;
    }
    table{
        display:inline-block;
        vertical-align: top;
    }
</style>