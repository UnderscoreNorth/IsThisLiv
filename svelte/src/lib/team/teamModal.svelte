<script lang='ts'>
	import { api } from "$lib/helper";
	import Modal from "$lib/modal.svelte";
    export let cupID:number;
    export let team:string;
    export let clear:Function;
    let data = (async () => {
		let returnObject = await api('/sql/cupTeamDisplay',{team,cupID});
		return returnObject;
	})();
</script>
<Modal close={clear} title={`/${team}/`}>
    {#await data}
        Loading...
    {:then data} 
        <table>
        {#each data as p}
            <tr>
                <td>{p.player.name}</td>
                <td>{p.player.medal}{p.player.captain ? '(C)' : ''}</td>
                <td>{p.player.regPos}</td>
                <td>{p.player.shirtNumber}</td>
            </tr>
        {/each}
    </table>
    {/await}
</Modal>