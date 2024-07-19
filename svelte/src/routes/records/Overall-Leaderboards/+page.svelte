<script lang='ts'>
	import { api } from "$lib/helper";
	import Table from "./table.svelte";
    import {onMount} from 'svelte'
    let cup = 0
    let cups = [];
    onMount((async()=>{
    cups = api('/cups/list').then((d)=>{
        cup = d[0].cupID
        loadCup()
        return d
    });
    }))
    let data;
    async function loadCup(){
        data = api('/records/leaderboards/' + cup)
    }
    /*
    <Table title={'Goals Per Match (Min 10 matches)'} headers={['#','Board','Name','GPM (# Matches)']} rows={data.gpm} />
           
    */
</script>
<container>
    {#await data then data}
        {#if data !== undefined && data.date !== undefined}
            <div id="pageModifiedTime">Last updated - {data.date}</div>  
        {/if}
    {/await}
    <h2>Leaderboards {#await cups then cups}
        <select bind:value={cup} on:change={()=>{loadCup()}}>
            {#each cups as cup}
                <option value={cup.cupID}>{cup.cupName}</option>
            {/each}
        </select>
    {/await}</h2>
    {#await data}
        Loading...
     {:then data}
        {#if data !== undefined && data.date !== undefined}
            <data>
                <Table title={'All Time Goalscorers'} headers={['#','Board','Name','Goals']} rows={data.mostGoals} />
                <Table title={'Most Hat Tricks'} headers={['#','Board','Name','Hat Tricks']} rows={data.mostHattricks} />
                <Table title={'All Time Cards'} headers={['#','Board','Name','Cards']} rows={data.mostCards} />  
                <Table title={'All Time Assists'} headers={['#','Board','Name','Assists']} rows={data.mostAssists} />    
                <Table title={'All Time Saves'} headers={['#','Board','Name','Saves']} rows={data.mostSaves} />    
                <Table title={'All Time Minutes Played'} headers={['#','Board','Name','Minutes']} rows={data.mostMinutes} /> 
                <Table title={'Most Man of the Matches'} headers={['#','Board','Name','Count']} rows={data.mostMotm} /> 
                <Table title={'Most Matches Played'} headers={['#','Board','Name','Count']} rows={data.mostMatchesP} /> 
                <Table title={'Most Matches Played (Team)'} headers={['#','Board','Count']} rows={data.mostMatchesT} /> 
                <Table title={'Highest Avg Cond (Min 10 Matches)'} headers={['#','Board','Name','Cond (#)']} rows={data.highestCondP} />
                <Table title={'Lowest Avg Cond (Min 10 Matches)'} headers={['#','Board','Name','Cond (#)']} rows={data.lowestCondP} />
                <Table title={'Highest Avg Cond (Team)'} headers={['#','Board','Cond']} rows={data.highestCondT} />
                <Table title={'Highest Avg Rating (Min 10 Matches)'} headers={['#','Board','Name','Rating (#)']} rows={data.highestRateP} />
                <Table title={'Lowest Avg Rating (Min 10 Matches)'} headers={['#','Board','Name','Rating (#)']} rows={data.lowestRateP} />
                <Table title={'Highest Avg Rating (Team)'} headers={['#','Board','Rating']} rows={data.highestRateT} />
                <Table title={'Most Clean Sheets (Player)'} headers={['#','Board','Name','# (%)']} rows={data.mostCleanP} />
                <Table title={'Highest Efficiency'} headers={['#','Board','Eff %','# Wins to 50%']} rows={data.highestEff} />
             </data>     
        {/if}
    {/await}
</container>
<style>
    container {
		display: block;
		padding: 1rem;
		height: calc(100% - 2rem);
		overflow-y: scroll;
	}
    h2 select{
        font-size: large;
        vertical-align: text-bottom;
    }
    #pageModifiedTime {
		float: right;
	}
    data{
        display:flex;
        flex-direction: row;
        flex-wrap: wrap;
    }
</style>