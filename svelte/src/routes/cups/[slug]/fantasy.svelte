<script lang='ts'>
	import { api } from "$lib/helper";
	import TeamIcon from "$lib/teamIcon.svelte";
	import TeamLink from "$lib/teamLink.svelte";
    // @ts-ignore
    import MdAdd from 'svelte-icons/md/MdAdd.svelte'
	// @ts-ignore
	import MdRemove from 'svelte-icons/md/MdRemove.svelte'
	import Fantasyplayer from "./fantasyplayer.svelte";
    export let cupID:number;
    export let expanded:Set<string> = new Set()
    let data = api('/ff/cup/' + cupID)
</script>
{#await data then data}
    <table style:border-collapse='collapse'>
        <tr>
            <th colspan=3>Team</th>
            <th style:width='3rem'>R1</th>
            <th style:width='3rem'>R2</th>
            <th style:width='3rem'>R3</th>
            <th style:width='3rem'>R4</th>
            <th></th>
            <th colspan=3></th>
            <th style:width='3rem'>Ro16</th>
            <th style:width='3rem'>QF</th>
            <th style:width='3rem'>SF</th>
            <th style:width='3rem'>3rd/<br>Finals</th>
            <th>Total</th>
        </tr>  
    {#each data as team}
    <tr>
        <th class='teamName' on:click={()=>{
            expanded.has(team.team) ? expanded.delete(team.team) : expanded.add(team.team);
            expanded = expanded;
            }}
            colspan=3
        >{team.team}
            <icon class='ffIcon'>
                {#if expanded.has(team.team)}
                    <MdRemove/>
                {:else}
                    <MdAdd/>
                {/if}
            </icon>
        </th>
        <td>{team.points.r1}</td>
        <td>{team.points.r2}</td>
        <td>{team.points.r3}</td>
        <td>{team.points.r4}</td>
        <th></th>
        <th colspan=3></th>
        <td>{team.points.ro16}</td>
        <td>{team.points.qf}</td>
        <td>{team.points.sf}</td>
        <td>{team.points.fn}</td>
        <td>{team.points.tot}</td>
    </tr>
    {#if expanded.has(team.team)}
        {#if team.group?.start?.length > 0}
            <tr><th colspan=2 /><th><u>Starting</u></th></tr>
            {#each Array(11) as _,i}
            <tr style:background='var(--bg-c1)'>
                <Fantasyplayer player={team.group.start[i]}/>
                <td>{team.group.start[i].points.r1 ?? '-'}</td>
                <td>{team.group.start[i].points.r2 ?? '-'}</td>
                <td>{team.group.start[i].points.r3 ?? '-'}</td>
                <td>{team.group.start[i].points.r4 ?? '-'}</td>
                <th  style:width='3rem' style:text-align='right'>{team.group.start[i].points.tot ?? '-'}</th>
                {#if team.ko.start[i]}
                    <Fantasyplayer player={team.ko.start[i]}/>
                    <td>{team.ko.start[i].points.ro16 ?? '-'}</td>
                    <td>{team.ko.start[i].points.qf ?? '-'}</td>
                    <td>{team.ko.start[i].points.sf ?? '-'}</td>
                    <td>{team.ko.start[i].points.fn ?? '-'}</td>
                {/if}
            </tr>
            {/each}
            <tr><th colspan=2 /><th><u>Bench</u></th></tr>
            {#each Array(5) as _,i}
            <tr  style:background='var(--bg-c1)'>
                <Fantasyplayer player={team.group.bench[i]}/>
                <td>{team.group.bench[i].points.r1 ?? '-'}</td>
                <td>{team.group.bench[i].points.r2 ?? '-'}</td>
                <td>{team.group.bench[i].points.r3 ?? '-'}</td>
                <td>{team.group.bench[i].points.r4 ?? '-'}</td>
                <th style:text-align='right'>{team.group.bench[i].points.tot ?? '-'}</th>
                {#if team.ko.bench[i]}
                     <Fantasyplayer player={team.ko.bench[i]}/>
                    <td>{team.ko.bench[i].points.ro16 ?? '-'}</td>
                    <td>{team.ko.bench[i].points.qf ?? '-'}</td>
                    <td>{team.ko.bench[i].points.sf ?? '-'}</td>
                    <td>{team.ko.bench[i].points.fn ?? '-'}</td>
                {/if}
            </tr>
            {/each}
        {:else}
            <tr><td colspan=3 style:text-align='left'>No players</td></tr>
        {/if}
    {/if}
{/each}
    </table>
{/await}
<style>
    .ffIcon {		
        height:1rem;
        width:1rem;
        padding:0;
        vertical-align: text-top;
    }
    .teamName:hover {
        background: #2e51a2;
        cursor: pointer;
    }
    .teamName{
        text-align: left;
    }
</style>