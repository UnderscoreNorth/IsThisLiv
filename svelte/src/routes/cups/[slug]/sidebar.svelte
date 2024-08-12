<script lang='ts'>
	import { goto } from "$app/navigation";
	import { api, cupShort } from "$lib/helper";
	import type { MainRes } from "./types";

    export let data:MainRes;
    let select:HTMLSelectElement;
    function changeCup(id=0){
		goto(select.value + '-' + select.options[select.selectedIndex].text.replace(" ","-"))
	}
    let cupsData = api('/cups/list');    
</script>
<img src='/icons/cups/{data.cupID}.png' alt='logo' style='border-radius:1rem;background:var(--bg-color);padding:5px' /><br/>
    {#await cupsData}
    <select></select>
    {:then cups}
    <div>
    <select class='element' style='margin-bottom:0.7rem' bind:this={select} value={data.cupID} on:change={()=>{changeCup()}}>
        {#each cups as row}
            <option value={row.cupID}>{cupShort(row.cupName)}</option>
        {/each}
    </select>
    </div>
    {/await}
<a href="#Top">Top</a>
<a href="#Teams">Competitors</a>
{#if data.matches.groups}
    <a href="#Groups">Group Stage</a>
    {#each data.matches.groups as group}
        <a style="padding-left:1rem" href="#{group.name}">{group.name}</a>
    {/each}
{/if}
{#if data.matches.kos}
    <a href="#Knockouts">Knockout Stage</a>
    {#each data.matches.kos as group}
        <a style="padding-left:1rem" href="#{group.name}">{group.name}</a>
    {/each}
{/if}
<a href="#Statistics">Statistics</a>
<a style="padding-left:1rem" href="#Goals">Goals</a>
<a style="padding-left:1rem" href="#Assists">Assists</a>
<a style="padding-left:1rem" href="#Saves">Saves</a>
<a style="padding-left:1rem" href="#Cards">Cards</a>
<a href="#Records">Records</a>
<a href="#Gallery">Gallery</a>
{#if data.cupType <= 2}
<a href='#Fantasy Football'>Fantasy Football</a>
<a href='#Rankings'>Rankings</a>{/if}
<style>
    .element{
		background: var(--bg-color);
		color: var(--fg-color);
		padding: 0.2rem;
	}
</style>