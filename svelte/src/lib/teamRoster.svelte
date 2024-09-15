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
        <td><a target="_blank" href='/players/{p.player.linkID}-{p.player.name}'>{p.player.name} {p.player.captain ? '(C)' : ''}</a></td>
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
        <td><a target="_blank" href='/players/{p.player.linkID}-{p.player.name}'>{p.player.name} {p.player.captain ? '(C)' : ''}</a></td>
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
    @media (width <= 700px){
        table{
            width:100%;
            margin-top:5px;
        }
    }
</style>