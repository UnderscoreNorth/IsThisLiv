<script lang='ts'>
	import {api } from "$lib/helper";
	import MatchEdit from "$lib/matches/MatchEdit.svelte";
	import TeamModal from "$lib/teamModal.svelte";
    type types = "cupTeam" | "match" | ""
    const data:Promise<{data:Record<
    string,
    { type: types; headers: string[]; rows: any[][] }
  > }> = api('/sql/getMaintenance');

    let matchID = 0;
    let cupID = 0;
    let team = '';
    function clickRow(type:types,val:any){
        if(type == 'cupTeam'){
            cupID = val.cupID;
            team = val.team;
        } else if (type == 'match'){
            matchID = val;
        }
    }
</script>
{#if matchID > 0}
	<MatchEdit bind:matchID />
{/if}
{#if cupID > 0 && team !== ''}
    <TeamModal {cupID} {team} clear={()=>{cupID=0;team=''}}/>
{/if}
<div style='padding:2rem'>
    {#await data then data}        
       {#each Object.keys(data.data) as table}
       <h3>{table}</h3>
       <table>
        <tr>{#each data.data[table].headers as header}
            <th>{header}</th>
            {/each}
        </tr>
        {#each data.data[table].rows as row}
            <tr on:click={()=>{clickRow(data.data[table].type,row[0])}}>
                {#each row as cell,i}
                {#if i !== 0}
                    <td>{cell}</td>
                {/if}
                {/each}
            </tr>
        {/each}
       </table>
       {/each}
    {/await}
</div>
<style>
    table tr:nth-child(n+2):hover{
        cursor: pointer;
        background-color: rgba(0,0,0,0.5);
    }
</style>