<script lang='ts'>
	import { api } from "$lib/helper";
	import Modal from "$lib/modal.svelte";
	import { User } from "$lib/user";
    export let cupID:number;
    export let team:string;
    export let clear:Function;
    let captain = -1;
    let updating = false;
    let data = (async () => {
		let returnObject = await api('/sql/cupTeamDisplay',{team,cupID});
        for(const p in returnObject.players){
            if(returnObject.players[p].player.captain)
                captain = parseInt(p);
        }
		return returnObject;
	})();
    async function update(){
        updating = true;
        let players = await data.then((r)=>{
            return r.players;
        });
        for(let p in players){
            if(parseInt(p)==captain) {
                players[p].player.captain = true;
            } else {
                players[p].player.captain = false;
            }
            players[p] = players[p].player
        }
        await api('/sql/updateCupTeam',{players})
        location.reload();
    }
</script>
<Modal close={clear} title={`/${team}/`}>
    {#await data}
        Loading...
    {:then data}
        {#if $User.access > 0}
        <table>
            <tr>
                <th>ID</th>
                <th>Starting</th>
                <th>Player</th>
                <th>Medal</th>
                <th>Captain</th>
                <th>Pos</th>
                <th>#</th>
                <th>Link</th>
            </tr>
        {#each data.players as p,i}
            <tr>
                <td><small>{p.player.playerID}</small></td>
                <td><input type='checkbox' bind:checked={p.player.starting} ></td>
                <td><input bind:value={p.player.name}></td>
                <td><select bind:value={p.player.medal}>
                    <option></option>
                    <option>Gold</option>
                    <option>Silver</option>
                    <option>Bronze</option>
                </select></td>
                <td><input type='radio' value={parseInt(i)} bind:group={captain}></td>
                <td><input style:width={'2.5rem'} bind:value={p.player.regPos}></td>
                <td><input style:width={'2.5rem'} bind:value={p.player.shirtNumber}></td>
                <td><select bind:value={p.player.linkID}>
                    <option></option>
                    {#each data.links as link}
                    <option value={link.linkID}>{link.name}</option>
                    {/each}
                </select></td>
            </tr>
        {/each}
        </table>
        <button disabled={updating} on:click={()=>{update()}}>Update</button>
        {:else}
        <table>
            <tr>
                <th>Starting</th>
                <th>Medal</th>
                <th>Pos</th>
                <th>#</th>
            </tr>
        {#each data.players.filter(x=>x.player.starting) as p}
            <tr class={p.player.medal}>
                <td>{p.player.name}</td>
                <td>{p.player.medal}{p.player.captain ? '(C)' : ''}</td>
                <td>{p.player.regPos}</td>
                <td>{p.player.shirtNumber}</td>
            </tr>
        {/each}
        </table>
        <table>
            <tr>
                <th>Bench</th>
                <th>Medal</th>
                <th>Pos</th>
                <th>#</th>
            </tr>
        {#each data.players.filter(x=>!x.player.starting) as p}
            <tr  class={p.player.medal}>
                <td>{p.player.name}</td>
                <td>{p.player.medal}{p.player.captain ? '(C)' : ''}</td>
                <td>{p.player.regPos}</td>
                <td>{p.player.shirtNumber}</td>
            </tr>
        {/each}
        </table>
        {/if} 
    {/await}
</Modal>
<style>
    small{
        font-size: xx-small;
    }
    td{
        text-align: left;
    }
    table{
        display:inline-block;
        vertical-align: top;
    }
</style>