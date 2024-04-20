<script lang='ts'>
    // @ts-ignore
	import MdAdd from 'svelte-icons/md/MdAdd.svelte'
	// @ts-ignore
	import MdRemove from 'svelte-icons/md/MdRemove.svelte'
    export let show:Record<string,boolean>;
    export let section:string;
</script>
<h2 id={section}>
    {section}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <icon class='sectionIcon' on:click={()=>{show[section]=!show[section]}}>
        {#if show[section]}
            <MdRemove/>
        {:else}
            <MdAdd/>
        {/if}
    </icon>
</h2>
{#if show[section]}
    <slot/>
{/if}
<style>
    .sectionIcon {		
        height:1.5rem;
        width:1.5rem;
        padding:0;
        vertical-align: text-top;
    }
    .sectionIcon:hover {
        background: #2e51a2;
    }
</style>