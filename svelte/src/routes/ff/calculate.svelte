<script lang='ts'>
	import { api } from "$lib/helper";

    let outputText = '';
    
    let cup = 0;
    let cups = api('/cups/list').then((d)=>{
        cup = d[0].cupID
        return d
    });
    async function calculate(){
        outputText = 'Calculating...'
        api('/ff/calculate',{cupID:cup}).then((d)=>{
            if(d.error){
                outputText = d.error;
            } else {
                outputText = 'Cup calculated'
            }
        }).catch(()=>{
            outputText = 'Something wrong happened'
        })
    }
    let textArea = ''
    async function getMainPage(){
        outputText = 'Calculating...'
        api('/ff/mainWiki',{cupID:cup}).then((d)=>{
            if(d.error){
                outputText = d.error;
            } else {
                outputText = ''
                textArea = d.wiki;
            }
        }).catch(()=>{
            outputText = 'Something wrong happened'
        })
    }
    async function getPlayerPage(){
        outputText = 'Calculating...'
        api('/ff/playerWiki',{cupID:cup}).then((d)=>{
            if(d.error){
                outputText = d.error;
            } else {
                outputText = ''
                textArea = d.wiki;
            }
        }).catch(()=>{
            outputText = 'Something wrong happened'
        })
    }
</script>
{#await cups then cups}
<div>
    <hr/>
    <select bind:value={cup}>
        {#each cups as cup}
            <option value={cup.cupID}>{cup.cupName}</option>
        {/each}
    </select><br>
    <button on:click={()=>{calculate();}}>
        Calculate
    </button>
    <button on:click={()=>{getMainPage()}}>
        Main Wiki Page
    </button>
    <button on:click={()=>{getPlayerPage()}}>
        Individuals Wiki Page
    </button>
    <br>
    <div>{outputText}</div>
    <textarea rows={10}>{textArea}</textarea>
</div>
{/await}

<style>
    button,select{
        padding: 0.5rem;
		margin: 0.5rem;
    }
    textarea{
        width:30rem
    }
</style>