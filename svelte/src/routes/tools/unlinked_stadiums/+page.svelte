<script lang='ts'>
	import {api } from "$lib/helper";
    let selected = 'Unlinked';
    let stadium = '';
    let data:Promise<{stadiums:Array<string>,stadiumLinks:Array<{stadium:string,alias:string}>}> = api('/sql/getStadiums');
    async function linkStadium(stadium:string,alias:string){
        await api('/sql/linkStadium',{stadium,alias});
        data = api('/sql/getStadiums');
    }
    async function unlinkStadium(stadium:string,alias:string){
        await api('/sql/unlinkStadium',{stadium,alias});
        data = api('/sql/getStadiums');
    }
</script>
<div style='padding:2rem'>
    {#await data then {stadiums,stadiumLinks}} 
        <datalist id='data'>
            {#each Array.from(new Set(stadiumLinks.map(x=>x.stadium))) as stadium}
                <option value={stadium} />
            {/each}
        </datalist>       
        <div class='cat' style:border-right='solid 1px var(--fg-color)'>
            <div class='stadium {selected == 'Unlinked' ? 'sel' : ''}' on:click={()=>selected='Unlinked'}>Unlinked</div>
            {#each Array.from(new Set(stadiumLinks.map(x=>x.stadium))) as s}
                <div class='stadium {selected == s ? 'sel' : ''}'  on:click={()=>selected=s}>{s}</div>
            {/each}
        </div>
        <div class='cat'>
            <table>
            {#each stadiums.filter(x=>(selected=='Unlinked' && stadiumLinks.filter(y=>y.alias==x).length == 0) || (selected !=='Unlinked' && stadiumLinks.filter(y=>y.alias==x && y.stadium==selected).length > 0)) as s}
                <tr>
                    <td>{s}</td>
                    {#if selected == 'Unlinked'}
                        <td><input list='data' bind:value={stadium}><button on:click={()=>linkStadium(stadium,s)}>Create/Link</button>
                            <button on:click={()=>linkStadium(s,s)}>Use Stadium Name</button></td>
                    {:else}
                        <td><button on:click={()=>unlinkStadium(selected,s)}>Unlink</button></td>
                    {/if}
                </tr>
            {/each}
            </table>
        </div>
    {/await}
</div>
<style>
    .stadium{
        cursor: pointer;
    }
    .sel{
        font-weight: bold;
    }
    .cat{
        display:inline-block;
        vertical-align: top;
        padding: 0 1rem;
    }
</style>