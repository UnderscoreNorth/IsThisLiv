<script>
	import { api, cupShort } from "$lib/helper";

    const data = api('/players/getUnlinked');
    let linked = new Set();
    function useLink(player){
        linked.add(player.playerID);
        linked = linked;
        api('/sql/playerLink/',{player});
    }
</script>
<div style='padding:2rem'>
    {#await data then {unlinkedPlayers, teamLinks}}
        <table>
        {#key linked.size}
        {#each unlinkedPlayers as {player, cup}}
            <tr>
                <td>{cupShort(cup.cupName)}</td>
                <td>/{player.team}/</td>
                <td>{player.name}</td>
                <td>
                        <button
                        disabled={linked.has(player.playerID)}
                        on:click={()=>{useLink(player)}}>{player.linkID ? 'Use Link' : 'Create New Link'}</button>
                </td>
                <td>
                    <select bind:value={player.linkID} disabled={linked.has(player.playerID)}>
                            <option></option>
                        {#each teamLinks[player.team] as link}
                            <option value={link.linkID}>{link.name}</option>
                        {/each}
                    </select>
                </td>
            </tr>
        {/each}
        {/key}
        </table>
    {/await}
</div>
<style>
    td{
        text-align: left;
        padding-bottom: 1rem;

    }
</style>
