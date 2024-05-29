<script lang='ts'>
	import { api } from "$lib/helper";    
    const commands:Record<string,{link:string,inProgress:boolean}> = {
        'Clear Cache':{link:'/sql/clearCache',inProgress:false},
        'Rebuild Cup Records':{link:'/sql/rebuildCupRecords',inProgress:false},
        'Rebuild Team Records':{link:'/sql/rebuildTeamRecords',inProgress:false},
    };
    async function runCommand(key:string){
        commands[key].inProgress = true;
        await api(commands[key].link)
        commands[key].inProgress = false;
    }
</script>
<div style='padding:2rem'>
    {#each Object.entries(commands) as [command,data]}
    <button on:click={()=>{runCommand(command)}} disabled={data.inProgress}>{command}</button><br>
    {/each}
</div>
<style>
    button{
        margin:5px;
    }
</style>