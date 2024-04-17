<script>
	import { api } from "$lib/constants";    
    let text = 'Clear Cache'
    async function clearCache(){
        text = 'Clearing'
        await api('/sql/clearCache')
        text = 'Cache Cleared';
    }
</script>
<div style='padding:2rem'><button on:click={()=>{clearCache()}} disabled={text !=='Clear Cache'}>{text}</button></div>
