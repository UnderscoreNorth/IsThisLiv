<script lang="ts">
	import Brackets from "$lib/brackets.svelte";
	import MatchDisplay from "$lib/matches/matchDisplay.svelte";
	import type { MainRes } from "./types";
    export let editMatch:Function;
    export let data:MainRes;
</script>
{#if data.matches.groups}
    <h2 id="Groups">Group Stage</h2>
    <div class='groupsContainer' style="padding:0 2rem">
        {#each data.matches.groups as group}
            <div class="groups">
                <h3 id={group.name}>{group.name}</h3>
                {#if !['Playoff Knockout'].includes(group.name)}
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
                            <tr class={row.status}>
                                {#each row.data as cell}
                                    <td>{@html cell}</td>
                                {/each}
                            </tr>
                        {/each}
                    </groupTable>
                {/if}
                {#each group.matches as match}
                    <match>
                        <MatchDisplay {editMatch} {match} />
                    </match>
                {/each}
            </div>
        {/each}
    </div>
{/if}
{#if data.matches.kos}
    <h2 id="Knockouts">Knockout Stage</h2>
    <div id='bracketContainer'>
    <Brackets data2={data} />
</div>
    <div class='groupsContainer' style="padding:0 2rem">
        {#each data.matches.kos as group}
            <div class="kos">
                <h3 id={group.name}>{group.name}</h3>
                {#each group.matches as match}
                    <match>
                        <MatchDisplay {editMatch} {match} />
                    </match>
                {/each}
            </div>
        {/each}
    </div>
{/if}
<style>
    groupTable {
        display: table;
        border-collapse: collapse;
        border-radius: 2px;
        margin-bottom: 1rem;
    }
    groupTable th {
        background: #eee;
    }
    groupTable,
    th,
    td {
        border: solid 1px #c9c9c9;
        color: black;
        padding: 2px;
        text-align: center;
        min-width: 2rem;
    }
    :global(.groups td a) {
        color: black !important;
    }
    tr.green {
        background: #ccffcc;
    }
    tr.red {
        background: #ffcccc;
    }
    match {
		display: grid;
		grid-template-columns: 3fr 2fr 1fr 2fr 3fr;
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.groups match:nth-child(2n):not(:last-of-type) {
		border-bottom: solid 1px grey;
	}
	.kos match:not(:last-of-type) {
		border-bottom: solid 1px grey;
	}
	groupTable tr td:nth-child(1){
		text-align: left;
	}
    
    @media only screen and (max-width: 1000px) {
        .groups{
            display:flex;
            flex-wrap: wrap;
            flex-direction: column;
        }
        groupTable th, groupTable td{
            min-width: 0 !important;
        }
        .groupsContainer{
            padding:0 !important;	
        }
        #bracketContainer{
            overflow-x: auto;
            min-width: 40rem;
            min-height: fit-content;
        }
    }
</style>