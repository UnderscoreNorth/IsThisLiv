<script lang='ts'>
	import type { MainRes } from "./types";

    export let data:MainRes
    let types = [{title:'Goals',key:'scorers'},{title:'Own Goals',key:'owngoalers'},{title:'Assists',key:'assisters'},{title:'Saves',key:'goalies'},{title:'Cards',key:'cards'}]
</script>

{#each types as type}
    <h2 id={type.title}>{type.title}</h2>    
    {#each data[type.key] as subArr}
        {#if subArr?.num}
            <h3>{subArr.num}</h3>
            <div class='players'>
                {#each subArr.players as scorer}
                    <div class='player'>{@html scorer}</div>
                {/each}
            </div>
        {/if}
    {/each}
{/each}
<style>
    .players{
        display:flex;
        flex-wrap: wrap;
        gap: 1rem;
    }
    .player{
        white-space: nowrap;
    }
</style>