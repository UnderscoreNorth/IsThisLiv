<script>
    import config from '../../../config.json';
    import { page } from '$app/stores';
    import {teamLink} from '$lib/helper';
    import MatchEdit from '$lib/matchEdit.svelte';
    import MatchDisplay from '$lib/matchDisplay.svelte';
    import Brackets from '$lib/brackets.svelte';
    let api = config.api;
    let matchID = 0;
    let data = (async()=>{
        const response = await fetch(`${api}api` + $page.url.pathname);
        return await response.json();
    })();
    function editMatch(ID){
        matchID = ID;
    }
</script>
{#await data}
    Loading...
{:then data} 
    <container>
        <vertNav class='c-1'>
            <a href='#Nav'>Top</a>
            <a href='#Teams'>Competitors</a>
            {#if data.matches.groups}
            <a href='#Groups'>Group Stage</a>
            {#each data.matches.groups as group}
                <a style='padding-left:1rem' href='#{group.name}'>{group.name}</a>
            {/each}
            {/if}
            {#if data.matches.kos}
            <a href='#Knockouts'>Knockout Stage</a>
            {#each data.matches.kos as group}
                <a style='padding-left:1rem' href='#{group.name}'>{group.name}</a>
            {/each}
            {/if}
            <a href='#Stats'>Statistics</a>
            <a href='#Stats'>Fantasy Football</a>
        </vertNav>
        <contents>
            <h1>{data.cupName}</h1>
            <statContainer class='c-1'>
                Dates: {data.dates} Matches: {data.numMatches} Goals Scored: {data.goals} ({data.gpm} gpm)
        
            </statContainer>
            <teamsContainer id='Teams' class='c-1'>
                {#each data.teams as teamData}
                    <teamBox class='c-2'>{@html teamLink(teamData.name)}</teamBox>
                {/each}
            </teamsContainer>
            {#if data.matches.groups}
                <h2 id='Groups'>Group Stage</h2>
                <div style='padding:0 2rem'>
                    {#each data.matches.groups as group}
                        <div class='groups'>
                            <h3 id={group.name}>{group.name}</h3>
                            <groupTable>
                                <tr>
                                    <th>Team</th>
                                    <th>Pld</th>
                                    <th>W</th>
                                    <th>D</th>
                                    <th>L</th>
                                    <th>GF</th>
                                    <th>GA</th>
                                    <th>GD</th>
                                    <th>Pts</th>
                                </tr>
                                {#each group.table as row}
                                    <tr class='{row.status}'>
                                        {#each row.data as cell}
                                            <td>{@html cell}</td>
                                        {/each}
                                    </tr>
                                {/each}
                            </groupTable>
                            {#each group.matches as match}
                                <match>
                                    <MatchDisplay editMatch={editMatch} match={match}/>
                                </match>
                            {/each}
                        </div>
                    {/each}
                </div>
            {/if}
            {#if data.matches.kos}
                <h2 id='Knockouts'>Knockout Stage</h2>
                <Brackets data={data}></Brackets>
                <div style='padding:0 2rem'>
                    {#each data.matches.kos as group}
                        <div class='kos'>
                            <h3 id={group.name}>{group.name}</h3>
                            {#each group.matches as match}
                                <match>
                                    <MatchDisplay editMatch={editMatch} match={match}/>
                                </match>
                            {/each}
                        </div>
                    {/each}
                </div>
            {/if}
            {#if matchID > 0}
                <MatchEdit bind:matchID={matchID}/>
            {/if}
        </contents>
    </container>
{/await}

<style>
    container{
        display:grid;
        grid-template-columns:10rem 1fr;
        position:relative;
        height:100%;
    }
    contents{
        height:calc(100% - 2rem);
        overflow-y:scroll;
        padding:1rem;
        width:calc(100% - 2rem);
    }
    statContainer{
        margin:1rem;
        padding:0.5rem;
    }
    teamsContainer{
        margin:1rem;
        border:solid 1px #a2a9b1;
        display:grid;
        grid-template-columns: repeat(8,1fr);
        width:calc(100% - 3rem);
    }
    groupTable{
        display:table;
        border-collapse: collapse;
        border-radius:2px;
        margin-bottom:1rem;
    }
    groupTable th{
        background:#EEE
    }
    groupTable, th, td{
        border:solid 1px #C9C9C9;
        color:black;
        padding:2px;
        text-align: center;
        min-width:2rem;
    }
    td a{
        color:black!important;
    }
    tr.green{
        background:#CCFFCC;
    }
    tr.red{
        background:#FFCCCC;
    }
    teamBox{
        display:inline-block;
        padding:1rem;
        margin:0.25rem;
        border-radius: 0.25rem;
    }
    match{
        display:grid;
        grid-template-columns: 3fr 2fr 1fr 2fr 3fr;
        padding-bottom:0.5rem;
        margin-bottom:0.5rem;
    }
    .groups match:nth-child(2n):not(:last-of-type){
        border-bottom:solid 1px grey;
    }
    .kos match:not(:last-of-type){
        border-bottom:solid 1px grey;
    }
    h2{
        border-bottom:solid 1px grey;
    }
</style>